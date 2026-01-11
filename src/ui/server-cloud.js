import { IncomingForm } from "formidable";
import fs from "fs";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { convertAudio } from "../processors/audio.js";
import { processImage } from "../processors/image.js";
import { jsonTools } from "../processors/json.js";
import { optimizeSVG } from "../processors/svg.js";
import { normalizeWatermarkText } from "../utils/watermark.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const staticRoot = __dirname;
const LOG = process.env.UI_LOG === "1" || process.env.UI_LOG === "true";

// Environment configuration
const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE, 10) || 100) * 1024 * 1024; // MB to bytes
const RATE_LIMIT_WINDOW = (parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 15) * 60 * 1000; // minutes to ms
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX, 10) || 50;

// Ensure upload directory
const uploadDir = path.join(process.cwd(), "tmp");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("[server] Created tmp upload dir:", uploadDir);
}

// Rate limiting (in-memory, resets on restart - fine for free tier)
const rateLimitStore = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(ip, { windowStart: now, count: 1 });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetIn: RATE_LIMIT_WINDOW - (now - record.windowStart) 
    };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count };
}

// Cleanup old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now - record.windowStart > RATE_LIMIT_WINDOW) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes

// Cleanup old temp files (older than 1 hour)
function cleanupTempFiles() {
  try {
    const files = fs.readdirSync(uploadDir);
    const now = Date.now();
    let cleaned = 0;
    
    files.forEach(file => {
      const filePath = path.join(uploadDir, file);
      try {
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > 60 * 60 * 1000) { // 1 hour
          fs.unlinkSync(filePath);
          cleaned++;
        }
      } catch (e) {
        // File might be in use or already deleted
      }
    });
    
    if (cleaned > 0) {
      console.log(`[cleanup] Removed ${cleaned} old temp files`);
    }
  } catch (e) {
    console.error("[cleanup] Error:", e.message);
  }
}

// Run cleanup every 30 minutes
setInterval(cleanupTempFiles, 30 * 60 * 1000);
cleanupTempFiles(); // Run once on startup

function log(...a) { if (LOG) console.log("[server]", ...a); }

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

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.headers['x-real-ip'] ||
         req.socket.remoteAddress ||
         'unknown';
}

function serveStatic(req, res) {
  let p = req.url.split("?")[0];
  
  // Serve modern UI by default
  if (p === "/") p = "/index-modern.html";
  if (p === "/app.js") p = "/app-modern.js";
  
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
      keepExtensions: true,
      maxFileSize: MAX_FILE_SIZE
    });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function discoverPath(f) {
  return f?.filepath || f?.path || f?._writeStream?.path;
}

async function waitForFilePath(f, attempts = 12, delay = 25) {
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

function isImageByExtOrMime(name, mimetype) {
  const mt = (mimetype || "").toLowerCase();
  const nm = (name || "").toLowerCase();
  return mt.startsWith("image/") || IMAGE_EXT_RE.test(nm);
}

// Cleanup helper - removes file and swallows errors
function safeUnlink(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (e) {
    // Ignore errors
  }
}

/* Handlers */

async function handleImage(fields, files, res) {
  let f = files.file;
  if (!f) return send(res, 400, "No file field");
  if (Array.isArray(f)) f = f[0];

  const originalName = f.originalFilename || f.newFilename || f.filename || "unnamed";
  let realPath = await waitForFilePath(f);
  if (!realPath) return send(res, 400, "Temp file missing");

  const originalBytes = await waitForNonZero(realPath);
  if (!originalBytes) {
    safeUnlink(realPath);
    return send(res, 400, "Uploaded file is empty");
  }

  if (!isImageByExtOrMime(originalName, f.mimetype)) {
    safeUnlink(realPath);
    return send(res, 415, "Not an image file");
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
    console.error("[image][error]", e);
    safeUnlink(realPath);
    safeUnlink(baseOut);
    return send(res, 500, "Image processing failed: " + e.message);
  }

  const { outputPath, format: finalFmt } = result;
  
  try {
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
      "Content-Length": resultBytes,
      "Cache-Control": "no-cache"
    });
    res.end(data);
  } finally {
    // Cleanup both input and output files
    safeUnlink(realPath);
    safeUnlink(outputPath);
  }
}

async function handleSVG(fields, files, res) {
  let f = files.file;
  if (!f) return send(res, 400, "No file");
  if (Array.isArray(f)) f = f[0];
  
  let realPath = await waitForFilePath(f);
  if (!realPath) return send(res, 400, "Temp file missing");
  
  const name = (f.originalFilename || f.newFilename || "").toLowerCase();
  if (!name.endsWith(".svg")) {
    safeUnlink(realPath);
    return send(res, 415, "Not an SVG");
  }
  
  const out = realPath + ".opt.svg";
  
  try {
    optimizeSVG(realPath, out);
    const data = fs.readFileSync(out);
    res.writeHead(200, {
      "Content-Type": "image/svg+xml",
      "X-Original-Name": encodeURIComponent(name),
      "Content-Length": data.length,
      "Cache-Control": "no-cache"
    });
    res.end(data);
  } catch (e) {
    console.error("[svg][error]", e);
    return send(res, 500, "SVG optimize failed: " + e.message);
  } finally {
    safeUnlink(realPath);
    safeUnlink(out);
  }
}

async function handleJSON(fields, files, res) {
  let f = files.file;
  if (!f) return send(res, 400, "No file");
  if (Array.isArray(f)) f = f[0];
  
  const realPath = await waitForFilePath(f);
  if (!realPath) return send(res, 400, "Temp file missing");
  
  try {
    const val = jsonTools.validateFile(realPath);
    if (!val.valid) {
      res.writeHead(200, { 
        "Content-Type": "application/json", 
        "X-Result": "invalid",
        "Cache-Control": "no-cache"
      });
      return res.end(JSON.stringify(val));
    }
    
    const content = fs.readFileSync(realPath, "utf8");
    const body = JSON.stringify(JSON.parse(content));
    
    res.writeHead(200, { 
      "Content-Type": "application/json", 
      "X-Result": "minified",
      "Cache-Control": "no-cache"
    });
    res.end(body);
  } catch (e) {
    console.error("[json][error]", e);
    return send(res, 500, "JSON processing failed");
  } finally {
    safeUnlink(realPath);
  }
}

async function handleAudio(fields, files, res) {
  let f = files.file;
  if (!f) return send(res, 400, "No file");
  if (Array.isArray(f)) f = f[0];
  
  const realPath = await waitForFilePath(f);
  if (!realPath) return send(res, 400, "Temp file missing");
  
  const out = realPath + ".conv";
  
  try {
    await convertAudio({
      input: realPath,
      output: out,
      format: fields.format || "ogg",
      bitrate: fields.bitrate || "128k"
    });
    
    const data = fs.readFileSync(out);
    res.writeHead(200, { 
      "Content-Type": "application/octet-stream", 
      "Content-Length": data.length,
      "Cache-Control": "no-cache"
    });
    res.end(data);
  } catch (e) {
    console.error("[audio][error]", e);
    return send(res, 500, "Audio convert failed: " + e.message);
  } finally {
    safeUnlink(realPath);
    safeUnlink(out);
  }
}

async function handlePDF(fields, files, res) {
  let f = files.file;
  if (!f) return send(res, 400, "No file");
  if (Array.isArray(f)) f = f[0];
  
  const realPath = await waitForFilePath(f);
  if (!realPath) return send(res, 400, "Temp file missing");
  
  try {
    const data = fs.readFileSync(realPath);
    res.writeHead(200, { 
      "Content-Type": "application/pdf", 
      "Content-Length": data.length,
      "Cache-Control": "no-cache"
    });
    res.end(data);
  } finally {
    safeUnlink(realPath);
  }
}

function handleHealth(req, res) {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    rateLimitActive: rateLimitStore.size
  };
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(health));
}

function handleStats(req, res) {
  const stats = {
    tempFiles: fs.readdirSync(uploadDir).length,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
    activeRateLimits: rateLimitStore.size,
    nodeVersion: process.version,
    platform: process.platform
  };
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(stats, null, 2));
}

function notFound(res) { 
  send(res, 404, "Not found"); 
}

export function startServer(port = 5173) {
  const server = http.createServer(async (req, res) => {
    // CORS headers for cross-origin requests
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      return res.end();
    }
    
    try {
      // Health check endpoint (no rate limiting)
      if (req.method === "GET" && req.url === "/health") {
        return handleHealth(req, res);
      }
      
      // Stats endpoint (no rate limiting)
      if (req.method === "GET" && req.url === "/stats") {
        return handleStats(req, res);
      }
      
      // Rate limiting for API endpoints
      if (req.method === "POST" && req.url.startsWith("/api/")) {
        const clientIP = getClientIP(req);
        const rateCheck = checkRateLimit(clientIP);
        
        res.setHeader("X-RateLimit-Limit", RATE_LIMIT_MAX);
        res.setHeader("X-RateLimit-Remaining", rateCheck.remaining || 0);
        
        if (!rateCheck.allowed) {
          res.setHeader("X-RateLimit-Reset", Math.ceil(rateCheck.resetIn / 1000));
          return send(res, 429, `Rate limit exceeded. Please try again in ${Math.ceil(rateCheck.resetIn / 60000)} minutes.`);
        }
        
        const { fields, files } = await parseMultipart(req);
        
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
      console.error("[server][error]", e);
      send(res, 500, e.message || "Internal error");
    }
  });
  
  server.listen(port, () => {
    console.log(`
╔════════════════════════════════════════╗
║     AssetForge Cloud Server Ready      ║
╠════════════════════════════════════════╣
║  URL: http://localhost:${port}         ║
║  Max File Size: ${MAX_FILE_SIZE / 1024 / 1024}MB                   ║
║  Rate Limit: ${RATE_LIMIT_MAX} requests/${RATE_LIMIT_WINDOW / 60000}min       ║
╚════════════════════════════════════════╝
    `);
  });
  
  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5173;
  startServer(port);
}
