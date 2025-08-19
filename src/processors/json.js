import fs from "fs";

export const jsonTools = {
  validateFile(file) {
    try {
      JSON.parse(fs.readFileSync(file, "utf8"));
      return { valid: true };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  },
  minifyFile(inFile, outFile) {
    const obj = JSON.parse(fs.readFileSync(inFile, "utf8"));
    fs.writeFileSync(outFile, JSON.stringify(obj));
    return { outFile };
  },
  prettyFile(inFile, outFile, spaces = 2) {
    const obj = JSON.parse(fs.readFileSync(inFile, "utf8"));
    fs.writeFileSync(outFile, JSON.stringify(obj, null, spaces));
    return { outFile };
  },
  diffFiles(aFile, bFile) {
    const a = JSON.parse(fs.readFileSync(aFile, "utf8"));
    const b = JSON.parse(fs.readFileSync(bFile, "utf8"));
    const diffs = [];
    walk("", a, b, diffs);
    return diffs;
  }
};

function walk(path, a, b, out) {
  if (JSON.stringify(a) === JSON.stringify(b)) return;
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) {
    out.push({ path, a, b });
    return;
  }
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    walk(path ? `${path}.${k}` : k, a[k], b[k], out);
  }
}