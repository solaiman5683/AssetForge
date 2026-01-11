import sharp from "sharp";
import fs from "fs";
import path from "path";
import { generateWatermarkSVG } from "../utils/watermark.js";

/**
 * processImage
 * Supports:
 *  - format (jpeg|png|webp|avif|auto)
 *  - quality
 *  - width
 *  - stripMetadata
 *  - watermarkText + watermarkOptions (position,color,opacity,fontSize,stroke,scale)
 */
export async function processImage({
  inputPath,
  inputBuffer,
  outputPath,
  format,
  quality = 80,
  width,
  stripMetadata = false,
  watermarkText,
  watermarkOptions = {}
}) {
  if (!inputPath && !inputBuffer) throw new Error("processImage: missing inputPath or inputBuffer");

  let img;
  try {
    if (inputBuffer) {
      if (!Buffer.isBuffer(inputBuffer) || !inputBuffer.length) throw new Error("Empty or invalid buffer");
      img = sharp(inputBuffer, { failOn: "error" });
    } else {
      if (!fs.existsSync(inputPath)) throw new Error("Input file not found: " + inputPath);
      const st = fs.statSync(inputPath);
      if (!st.size) throw new Error("Input file is empty: " + inputPath);
      img = sharp(inputPath, { failOn: "error" });
    }
  } catch (e) {
    throw new Error("Sharp init failed: " + e.message);
  }

  // Read initial metadata (might inform resizing decisions)
  const initialMeta = await img.metadata().catch(e => {
    throw new Error("Metadata read failed: " + e.message);
  });
  const originalFormat = initialMeta.format;

  // Resize if requested
  if (width) {
    img = img.resize({ width, withoutEnlargement: true });
  }

  // Rotate to normalize orientation.
  if (stripMetadata) {
    img = img.rotate(); // strips (since we do NOT call withMetadata)
  } else {
    img = img.rotate().withMetadata();
  }

  // After resizing/orientation, get final base size to scale watermark
  const baseMeta = await img.metadata();
  const baseW = baseMeta.width || initialMeta.width || 0;
  const baseH = baseMeta.height || initialMeta.height || 0;

  const targetFormat = decideFormat(format, originalFormat, outputPath);
  img = applyFormat(img, targetFormat, quality);

  // WATERMARK (dynamic sizing)
  if (watermarkText) {
    const {
      position = "southeast",
      color = "#ffffff",
      opacity = 0.35,
      fontSize,          // optional fixed
      stroke,
      strokeColor = "#000000",
      strokeWidth = 2,
      scale              // 0.1 - 1 (relative width fraction)
    } = watermarkOptions;

    const safeScale = clamp(scale, 0.1, 1, 0.6); // default 0.6 (60% width)
    const maxOverlayWidth = Math.floor(baseW * safeScale);
    // Maintain aspect ratio similar to original 400x120 (ratio 400/120 ≈ 3.333)
    // height = width / 3.333
    let overlayWidth = maxOverlayWidth;
    let overlayHeight = Math.floor(overlayWidth / (400 / 120));

    // Ensure overlay height not more than 25% of base height; adjust width if needed
    const maxOverlayHeight = Math.floor(baseH * 0.25);
    if (overlayHeight > maxOverlayHeight) {
      overlayHeight = maxOverlayHeight;
      overlayWidth = Math.floor(overlayHeight * (400 / 120));
    }

    // Clamp minimal sizes
    if (overlayWidth >= 20 && overlayHeight >= 12) {
      // Determine font size: either user-specified or proportional
      const dynFont = fontSize
        ? fontSize
        : Math.max(12, Math.min(overlayHeight * 0.7, overlayWidth / 8));

      const svg = generateWatermarkSVG(watermarkText, {
        width: overlayWidth,
        height: overlayHeight,
        fontSize: dynFont,
        opacity,
        fill: color,
        stroke: stroke ? strokeColor : null,
        strokeWidth: stroke ? strokeWidth : 0
      });

      if (svg) {
        const gravity = mapPositionToGravity(position);
        // Further safety: ensure overlay not larger (due to rounding) by resizing raster copy
        const overlay = sharp(Buffer.from(svg));
        const resizedOverlay = await overlay
          .resize({
            width: Math.min(overlayWidth, baseW),
            height: Math.min(overlayHeight, baseH),
            fit: "inside",
            withoutEnlargement: true
          })
          .toBuffer();
        img = img.composite([{ input: resizedOverlay, gravity }]);
      }
    }
  }

  // Normalize output extension
  let finalOutputPath = outputPath;
  const desiredExt = "." + extFor(targetFormat);
  if (!finalOutputPath.toLowerCase().endsWith(desiredExt)) {
    const base = finalOutputPath.replace(/\.[^.]+$/, "");
    finalOutputPath = base + desiredExt;
  }

  await img.toFile(finalOutputPath);

  return {
    outputPath: finalOutputPath,
    format: targetFormat,
    originalFormat,
    width: baseW,
    height: baseH
  };
}

/* -------- Helpers -------- */

function decideFormat(requested, original, outputPath) {
  if (requested && requested !== "auto" && requested.trim() !== "") {
    return normalizeFormat(requested);
  }
  if (["jpeg","png","webp","avif"].includes(original)) return original;
  const ext = (outputPath || "").split(".").pop().toLowerCase();
  if (["jpg","jpeg","png","webp","avif"].includes(ext)) {
    return ext === "jpg" ? "jpeg" : ext;
  }
  return "jpeg";
}

function normalizeFormat(fmt) {
  const f = fmt.toLowerCase();
  if (f === "jpg") return "jpeg";
  if (["jpeg","png","webp","avif"].includes(f)) return f;
  return "jpeg";
}

function extFor(fmt) {
  return fmt === "jpeg" ? "jpg" : fmt;
}

function applyFormat(instance, fmt, quality) {
  const q = clampQuality(quality);
  switch (fmt) {
    case "jpeg":
      return instance.jpeg({
        quality: q,
        mozjpeg: true,
        progressive: true,
        trellisQuantisation: true,
        overshootDeringing: true,
        optimizeScans: true
      });
    case "png":
      return instance.png({
        compressionLevel: 9,
        adaptiveFiltering: true,
        palette: true
      });
    case "webp":
      return instance.webp({
        quality: q,
        effort: 4
      });
    case "avif":
      return instance.avif({
        quality: mapAVIFQuality(q),
        effort: 4,
        chromaSubsampling: "4:2:0"
      });
    default:
      return instance.jpeg({ quality: q, mozjpeg: true });
  }
}

function clampQuality(q) {
  if (isNaN(q)) return 80;
  return Math.min(100, Math.max(1, q));
}

// Map JPEG-like quality to AVIF quality
function mapAVIFQuality(q) {
  if (q >= 90) return 62;
  if (q >= 80) return 58;
  if (q >= 70) return 54;
  if (q >= 60) return 50;
  if (q >= 50) return 46;
  if (q >= 40) return 42;
  if (q >= 30) return 38;
  return Math.max(25, q);
}

function mapPositionToGravity(pos) {
  const map = {
    northwest: "northwest",
    north: "north",
    northeast: "northeast",
    west: "west",
    center: "center",
    east: "east",
    southwest: "southwest",
    south: "south",
    southeast: "southeast"
  };
  return map[pos] || "southeast";
}

function clamp(val, min, max, fallback) {
  if (val == null) return fallback;
  const n = Number(val);
  if (isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}