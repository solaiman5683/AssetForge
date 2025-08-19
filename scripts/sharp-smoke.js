import sharp from "sharp";
import fs from "fs";
const inFile = process.argv[2];
if (!inFile) {
  console.error("Usage: node scripts/sharp-smoke.js <image>");
  process.exit(1);
}
if (!fs.existsSync(inFile)) {
  console.error("File not found:", inFile);
  process.exit(1);
}
try {
  await sharp(inFile).resize({ width: 100 }).toFile("smoke-output.jpg");
  console.log("Sharp smoke test OK -> smoke-output.jpg");
} catch (e) {
  console.error("Sharp failed:", e);
}