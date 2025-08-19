import fs from "fs";
export function loadConfig(path = "assetforge.config.json") {
  if (fs.existsSync(path)) {
    try {
      return JSON.parse(fs.readFileSync(path, "utf8"));
    } catch (e) {
      console.warn("[config] Failed to parse config:", e.message);
    }
  }
  return {};
}
export function mergeConfig(base, override) {
  return deepMerge(base, override);
}
function deepMerge(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) return b.slice();
  if (typeof a === "object" && typeof b === "object" && a && b) {
    const out = { ...a };
    for (const k of Object.keys(b)) out[k] = deepMerge(a[k], b[k]);
    return out;
  }
  return b === undefined ? a : b;
}