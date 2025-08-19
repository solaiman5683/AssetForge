#!/usr/bin/env node
import { Command } from "commander";
import fs from "fs";
import path from "path";
import { loadConfig, mergeConfig } from "./config.js";
import { processImage } from "./processors/image.js";
import { mergePDFs, watermarkPDF, splitPDFPlaceholder } from "./processors/pdf.js";
import { optimizeSVG } from "./processors/svg.js";
import { jsonTools } from "./processors/json.js";
import { convertAudio, trimAudioPlaceholder } from "./processors/audio.js";
import { createSpinner } from "./utils/spinner.js";
import { fileURLToPath } from "url";

const program = new Command();
program
  .name("assetforge")
  .description("Local asset optimization CLI")
  .version("0.1.0")
  .option("--config <file>", "Config file (default assetforge.config.json)")
  .option("--concurrency <n>", "Max parallel tasks", v => parseInt(v, 10))
  .option("--quiet", "Reduce output");

program.command("image")
  .description("Process a single image")
  .requiredOption("-i, --input <file>")
  .requiredOption("-o, --output <file>")
  .option("-w, --width <n>", "Resize width", v => parseInt(v, 10))
  .option("-q, --quality <n>", "Quality (1-100)", v => parseInt(v, 10))
  .option("--format <fmt>", "Output format (jpeg|png|webp|avif)")
  .option("--watermark <text>", "Text watermark")
  .action(async (opts, cmd) => {
    const cfg = effectiveConfig(cmd);
    const spin = !cmd.parent.opts().quiet && createSpinner("Image");
    if (spin) spin.start();
    try {
      await processImage({
        inputPath: opts.input,
        outputPath: opts.output,
        width: opts.width ?? cfg.image?.defaultWidth ?? undefined,
        quality: opts.quality ?? cfg.image?.quality ?? 80,
        format: opts.format,
        watermarkText: opts.watermark
      });
      if (spin) spin.stop("done");
    } catch (e) {
      if (spin) spin.fail(e.message);
      process.exit(1);
    }
  });

program.command("image-batch")
  .description("Batch process all images in a folder")
  .requiredOption("-s, --src <folder>")
  .requiredOption("-d, --dest <folder>")
  .option("-w, --width <n>", "Resize width", v => parseInt(v, 10))
  .option("-q, --quality <n>", "Quality (1-100)", v => parseInt(v, 10))
  .option("--format <fmt>", "Output format override")
  .option("--watermark <text>", "Watermark text")
  .action(async (opts, cmd) => {
    const cfg = effectiveConfig(cmd);
    const concurrency = cmd.parent.opts().concurrency || cfg.concurrency || 3;
    const exts = new Set([".jpg",".jpeg",".png",".webp",".avif"]);
    if (!fs.existsSync(opts.dest)) fs.mkdirSync(opts.dest, { recursive: true });
    const all = fs.readdirSync(opts.src).filter(f => exts.has(path.extname(f).toLowerCase()));
    if (!all.length) {
      console.log("No images.");
      return;
    }
    const queue = [...all];
    let active = 0;
    let done = 0;
    const total = queue.length;
    const quiet = cmd.parent.opts().quiet;
    const next = () => {
      if (!queue.length) return;
      while (active < concurrency && queue.length) {
        const file = queue.shift();
        active++;
        const inputPath = path.join(opts.src, file);
        const base = file.replace(/\.[^.]+$/, "");
        const outExt = opts.format ? (opts.format === "jpeg" ? ".jpg" : `.${opts.format}`) : path.extname(file);
        const outputPath = path.join(opts.dest, base + outExt);
        processImage({
          inputPath,
          outputPath,
          width: opts.width ?? cfg.image?.defaultWidth ?? undefined,
          quality: opts.quality ?? cfg.image?.quality ?? 80,
          format: opts.format,
          watermarkText: opts.watermark
        }).then(() => {
          done++; active--;
          if (!quiet) process.stdout.write(`\r${done}/${total} ${file}            `);
          next();
        }).catch(e => {
          active--; done++;
            process.stderr.write(`\nError ${file}: ${e.message}\n`);
            next();
        });
      }
    };
    next();
    await new Promise(res => {
      const int = setInterval(() => {
        if (done >= total) {
          clearInterval(int);
          if (!cmd.parent.opts().quiet) console.log("\nBatch complete.");
          res();
        }
      }, 80);
    });
  });

const pdf = program.command("pdf").description("PDF operations");
pdf.command("merge")
  .description("Merge PDFs")
  .requiredOption("-i, --inputs <files...>", "Input PDFs (space separated)")
  .requiredOption("-o, --output <file>", "Output PDF")
  .action(async (o) => {
    await mergePDFs(o.inputs, o.output);
    console.log("Merged:", o.output);
  });
pdf.command("watermark")
  .description("Watermark all pages")
  .requiredOption("-i, --input <file>")
  .requiredOption("-o, --output <file>")
  .requiredOption("--text <text>", "Watermark text")
  .action(async (o) => {
    await watermarkPDF(o.input, o.output, o.text);
    console.log("Watermarked:", o.output);
  });
pdf.command("split")
  .description("Split PDF (placeholder)")
  .requiredOption("-i, --input <file>")
  .action(async () => {
    try {
      await splitPDFPlaceholder();
    } catch (e) {
      console.error(e.message);
    }
  });

program.command("svg")
  .description("Optimize an SVG")
  .requiredOption("-i, --input <file>")
  .requiredOption("-o, --output <file>")
  .action(o => {
    const res = optimizeSVG(o.input, o.output);
    console.log(`SVG optimized: ${res.originalSize} -> ${res.optimizedSize} bytes`);
  });

const json = program.command("json").description("JSON tools");
json.command("validate")
  .requiredOption("-f, --file <file>")
  .action(o => {
    const r = jsonTools.validateFile(o.file);
    console.log(r.valid ? "Valid JSON" : "Invalid: " + r.error);
  });
json.command("minify")
  .requiredOption("-f, --file <file>")
  .requiredOption("-o, --output <file>")
  .action(o => {
    jsonTools.minifyFile(o.file, o.output);
    console.log("Minified ->", o.output);
  });
json.command("pretty")
  .requiredOption("-f, --file <file>")
  .requiredOption("-o, --output <file>")
  .option("-s, --spaces <n>", "Spaces", v => parseInt(v, 10), 2)
  .action(o => {
    jsonTools.prettyFile(o.file, o.output, o.spaces);
    console.log("Pretty ->", o.output);
  });
json.command("diff")
  .requiredOption("-a, --afile <file>")
  .requiredOption("-b, --bfile <file>")
  .action(o => {
    const diffs = jsonTools.diffFiles(o.afile, o.bfile);
    if (!diffs.length) console.log("No differences.");
    else diffs.slice(0, 50).forEach(d => console.log(d.path, "=>", d.a, "->", d.b));
    if (diffs.length > 50) console.log(`(${diffs.length - 50} more omitted)`);
  });

const audio = program.command("audio").description("Audio operations");
audio.command("convert")
  .requiredOption("-i, --input <file>")
  .requiredOption("-o, --output <file>")
  .option("--format <fmt>", "Target format (ogg|mp3|webm etc)")
  .option("--bitrate <br>", "Bitrate e.g. 128k", "128k")
  .action(async o => {
    await convertAudio({ input: o.input, output: o.output, format: o.format, bitrate: o.bitrate });
    console.log("Audio converted:", o.output);
  });
audio.command("trim")
  .description("Trim audio (placeholder)")
  .action(async () => {
    try { await trimAudioPlaceholder(); } catch (e) { console.error(e.message); }
  });

program.command("ui")
  .description("Launch local UI server")
  .action(async () => {
    const mod = await import("./ui/server.js");
    mod.startServer();
  });

program.parseAsync(process.argv);

function effectiveConfig(cmd) {
  const parent = cmd.parent || {};
  const file = parent.opts().config || "assetforge.config.json";
  const loaded = loadConfig(file);
  const base = { image: { quality: 80 }, concurrency: 3 };
  return mergeConfig(base, loaded);
}