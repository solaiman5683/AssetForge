/**
 * Flexible watermark SVG generator.
 * stroke == null => no stroke.
 */
export function generateWatermarkSVG(rawText, opts = {}) {
  const {
    width = 400,
    height = 120,
    fontSize = 32,
    opacity = 0.35,
    fill = "#ffffff",
    stroke = null,
    strokeWidth = 2
  } = opts;

  const text = normalizeWatermarkText(rawText);
  if (!text) return null;
  const safeText = escapeXML(text);

  const withStroke = stroke && strokeWidth > 0;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"
     xmlns="http://www.w3.org/2000/svg" role="img" aria-label="watermark">
  <rect width="${width}" height="${height}" fill="none"/>
  <text
    x="50%" y="50%"
    text-anchor="middle"
    dominant-baseline="middle"
    font-family="system-ui,Arial,sans-serif"
    font-size="${fontSize}"
    font-weight="600"
    fill="${fill}"
    ${withStroke ? `stroke="${stroke}" stroke-width="${strokeWidth}"` : ""}
    opacity="${opacity}"
    style="paint-order:stroke fill; letter-spacing:1px;"
  >${safeText}</text>
</svg>`;
}

export function normalizeWatermarkText(value) {
  if (value == null) return "";
  if (Array.isArray(value)) {
    for (const v of value) {
      if (typeof v === "string" && v.trim()) return truncate(v.trim(), 200);
    }
    return "";
  }
  if (typeof value === "object" && value.toString === Object.prototype.toString) return "";
  const str = String(value).trim();
  return str ? truncate(str, 200) : "";
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max) : str;
}

function escapeXML(input) {
  const str = typeof input === "string" ? input : String(input ?? "");
  return str.replace(/[<>&"']/g, c => ({
    "<":"&lt;",">":"&gt;","&":"&amp;","\"":"&quot;","'":"&#39;"
  }[c]));
}