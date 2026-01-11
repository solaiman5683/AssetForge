import http from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { IncomingForm } from "formidable";
import { processImage } from "../processors/image.js";
import { optimizeSVG } from "../processors/svg.js";
import { jsonTools } from "../processors/json.js";
import { convertAudio } from "../processors/audio.js";
import { normalizeWatermarkText } from "../utils/watermark.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const staticRoot = __dirname;
const LOG = process.env.UI_LOG === "1" || process.env.UI_LOG === "true";

// Ensure our own upload temp dir
const uploadDir = path.join(process.cwd(), "tmp");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("[ui] Created tmp upload dir:", uploadDir);
}

function log(...a) { if (LOG) console.log("[ui]", ...a); }
function send(res, code, body, headers = {}) {
  res.writeHead(code, { "Content-Type": "text/plain; charset=utf-8", ...headers });
  res.end(body);
}

function firstString(v) {
  if (Array.isArray(v)) {
    return v.find(x => typeof x === "string" && x.trim())?.trim() || "";
  }
  return typeof v === "string" ? v.trim() : "";
}

function parseIntSafe(v, d) {
  const n = parseInt(firstString(v), 10);
  return isNaN(n) ? d : n;
}

function parseFloatSafe(v, d) {
  const n = parseFloat(firstString(v));
  return isNaN(n) ? d : n;
}

function truthy(v) {
  const s = firstString(v).toLowerCase();
  return ["1", "true", "yes", "on"].includes(s);
}

function mimeFor(fmt) {
  switch (fmt) {
    case "jpeg": return "image/jpeg";
    case "png": return "image/png";
    case "webp": return "image/webp";
    case "avif": return "image/avif";
    default: return "application/octet-stream";
  }
}

function serveStatic(req, res) {
  let p = req.url.split("?")[0];
  if (p === "/") p = "/index.html";
  const filePath = path.normalize(path.join(staticRoot, p));
  if (!filePath.startsWith(staticRoot)) return send(res, 403, "Forbidden");
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return send(res, 404, "Not found");
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".svg": "image/svg+xml",
    ".json": "application/json"
  };
  res.writeHead(200, { "Content-Type": map[ext] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
}

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      multiples: false,
      uploadDir,
      keepExtensions: true
      // You can add maxFileSize etc. here if needed
    });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

/* Helpers */

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function discoverPath(f) {
  return f?.filepath || f?.path || f?._writeStream?.path;
}

async function waitForFilePath(f, attempts = 12, delay = 25) {
  // Sometimes properties populate slightly later (very rare, but we handle)
  for (let i = 0; i < attempts; i++) {
    const p = discoverPath(f);
    if (p) return p;
    await wait(delay);
  }
  return null;
}

async function waitForNonZero(filePath, attempts = 20, delay = 30) {
  for (let i = 0; i < attempts; i++) {
    if (fs.existsSync(filePath)) {
      const s = fs.statSync(filePath).size;
      if (s > 0) return s;
    }
    await wait(delay);
  }
  return 0;
}

const IMAGE_EXT_RE = /\.(png|jpe?g|pjpeg|webp|avif|gif|tiff?|bmp|jfif|heic|heif|ico)$/i;

function isImageByExtOrMime(name, mimetype, filePath) {
  const mt = (mimetype || "").toLowerCase();
  const nm = (name || "").toLowerCase();
  if (mt.startsWith("image/")) return true;
  if (IMAGE_EXT_RE.test(nm)) return true;

  // Signature sniff fallback if filePath exists
  try {
    if (filePath && fs.existsSync(filePath)) {
      const fd = fs.openSync(filePath, "r");
      const buf = Buffer.alloc(16);
      fs.readSync(fd, buf, 0, 16, 0);
      fs.closeSync(fd);
      if (buf.slice(0, 2).toString("hex") === "ffd8") return true; // JPEG
      if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return true; // PNG
      if (buf.slice(0, 4).toString() === "RIFF" && buf.slice(8, 12).toString() === "WEBP") return true; // WEBP
      if (buf.slice(4, 8).toString() === "ftyp" && buf.slice(8, 12).toString().match(/avif|heic|heix/)) return true; // AVIF/HEIC
      // We could add GIF/TIFF sniff if needed
    }
  } catch (e) {
    log("signature sniff error:", e.message);
  }
  return false;
}

/* Handlers */

async function handleImage(fields, files, res) {
  let f = files.file;
  if (!f) return send(res, 400, "No file field");
  if (Array.isArray(f)) f = f[0];

  const originalName = f.originalFilename || f.newFilename || f.filename || "unnamed";
  let realPath = await waitForFilePath(f);
  if (!realPath) return send(res, 400, "Temp file missing (no path)");

  const originalBytes = await waitForNonZero(realPath);
  if (!originalBytes) return send(res, 400, "Uploaded file is empty (after wait)");

  if (!isImageByExtOrMime(originalName, f.mimetype, realPath)) {
    return send(res, 415, "Unsupported media type (not an image) name=" + originalName + " mt=" + (f.mimetype || ""));
  }

  const requestedFormat = firstString(fields.format);
  const width = parseIntSafe(fields.width);
  const quality = parseIntSafe(fields.quality, 80);
  const watermarkText = normalizeWatermarkText(fields.watermark);
  const wm_position = firstString(fields.wm_position) || "southeast";
  const wm_color = firstString(fields.wm_color) || "#ffffff";
  const wm_opacity = parseFloatSafe(fields.wm_opacity, 0.35);
  const wm_font = parseIntSafe(fields.wm_font, 32);
  const wm_stroke = truthy(fields.wm_stroke);
  const wm_scale = parseFloatSafe(fields.wm_scale, 0.6);
  const stripMeta = truthy(fields.stripMeta);

  const baseOut = realPath + ".out";

  let result;
  try {
    result = await processImage({
      inputPath: realPath,
      outputPath: baseOut,
      format: requestedFormat,
      quality,
      width,
      stripMetadata: stripMeta,
      watermarkText,
      watermarkOptions: {
        position: wm_position,
        color: wm_color,
        opacity: wm_opacity,
        fontSize: wm_font,
        stroke: wm_stroke,
        scale: wm_scale
      }
    });
  } catch (e) {
    console.error("[ui][image][error]", e);
    return send(res, 500, "Image processing failed: " + e.message);
  }

  const { outputPath, format: finalFmt } = result;
  const data = fs.readFileSync(outputPath);
  const resultBytes = data.length;
  const bytesSaved = originalBytes - resultBytes;
  const percentSaved = originalBytes > 0 ? (bytesSaved / originalBytes) * 100 : 0;

  res.writeHead(200, {
    "Content-Type": mimeFor(finalFmt),
    "X-Original-Name": encodeURIComponent(originalName),
    "X-Result-Format": finalFmt,
    "X-Original-Bytes": String(originalBytes),
    "X-Result-Bytes": String(resultBytes),
    "X-Bytes-Saved": String(bytesSaved),
    "X-Percent-Saved": percentSaved.toFixed(2),
    "Content-Length": resultBytes
  });
  res.end(data);

  fs.unlink(outputPath, () => { });
}

async function handleSVG(fields, files, res) {
  let f = files.file;
  if (!f) return send(res, 400, "No file");
  if (Array.isArray(f)) f = f[0];
  let realPath = await waitForFilePath(f);
  if (!realPath) return send(res, 400, "Temp file missing (no path)");
  const name = (f.originalFilename || f.newFilename || "").toLowerCase();
  if (!name.endsWith(".svg")) return send(res, 415, "Not an SVG");
  const out = realPath + ".opt.svg";
  try {
    optimizeSVG(realPath, out);
  } catch (e) {
    return send(res, 500, "SVG optimize failed: " + e.message);
  }
  const data = fs.readFileSync(out);
  res.writeHead(200, {
    "Content-Type": "image/svg+xml",
    "X-Original-Name": encodeURIComponent(name),
    "Content-Length": data.length
  });
  res.end(data);
  fs.unlink(out, () => { });
}

async function handleJSON(fields, files, res) {
  let f = files.file;
  if (!f) return send(res, 400, "No file");
  if (Array.isArray(f)) f = f[0];
  const realPath = await waitForFilePath(f);
  if (!realPath) return send(res, 400, "Temp file missing (no path)");
  const val = jsonTools.validateFile(realPath);
  if (!val.valid) {
    res.writeHead(200, { "Content-Type": "application/json", "X-Result": "invalid" });
    return res.end(JSON.stringify(val));
  }
  const content = fs.readFileSync(realPath, "utf8");
  let body;
  try { body = JSON.stringify(JSON.parse(content)); }
  catch (e) { return send(res, 500, "JSON parse failed"); }
  res.writeHead(200, { "Content-Type": "application/json", "X-Result": "minified" });
  res.end(body);
}

async function handleAudio(fields, files, res) {
  let f = files.file;
  if (!f) return send(res, 400, "No file");
  if (Array.isArray(f)) f = f[0];
  const realPath = await waitForFilePath(f);
  if (!realPath) return send(res, 400, "Temp file missing (no path)");
  const out = realPath + ".conv";
  try {
    await convertAudio({
      input: realPath,
      output: out,
      format: fields.format || "ogg",
      bitrate: fields.bitrate || "128k"
    });
  } catch (e) {
    return send(res, 500, "Audio convert failed: " + e.message);
  }
  const data = fs.readFileSync(out);
  res.writeHead(200, { "Content-Type": "application/octet-stream", "Content-Length": data.length });
  res.end(data);
  fs.unlink(out, () => { });
}

async function handlePDF(fields, files, res) {
  let f = files.file;
  if (!f) return send(res, 400, "No file");
  if (Array.isArray(f)) f = f[0];
  const realPath = await waitForFilePath(f);
  if (!realPath) return send(res, 400, "Temp file missing (no path)");
  const data = fs.readFileSync(realPath);
  res.writeHead(200, { "Content-Type": "application/pdf", "Content-Length": data.length });
  res.end(data);
}

function notFound(res) { send(res, 404, "Unknown endpoint"); }

export function startServer(port = 5173) {
  const server = http.createServer(async (req, res) => {
    try {
      if (req.method === "POST" && req.url.startsWith("/api/")) {
        const { fields, files } = await parseMultipart(req);
        log("[debug][raw files keys]", Object.keys(files));
        if (files.file && Array.isArray(files.file)) {
          log("[debug] files.file array length", files.file.length);
        }
        switch (req.url) {
          case "/api/image": return await handleImage(fields, files, res);
          case "/api/svg": return await handleSVG(fields, files, res);
          case "/api/json": return await handleJSON(fields, files, res);
          case "/api/audio": return await handleAudio(fields, files, res);
          case "/api/pdf": return await handlePDF(fields, files, res);
          default: return notFound(res);
        }
      } else if (req.method === "GET") {
        return serveStatic(req, res);
      }
      notFound(res);
    } catch (e) {
      console.error("[ui][error]", e);
      send(res, 500, e.message || "Internal error");
    }
  });
  server.listen(port, () => console.log("UI server at http://localhost:" + port));
  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5173;
  startServer(port);
}