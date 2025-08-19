import fs from "fs";
import path from "path";
import { processImage } from "../src/processors/image.js";
import sharp from "sharp";

const fixture = path.join(process.cwd(), "tests", "sample.jpg");

describe("image processor", () => {
  test("resizes image", async () => {
    if (!fs.existsSync(fixture)) {
      console.warn("sample.jpg missing; skipping");
      return;
    }
    const out = path.join(process.cwd(), "tests", "out.jpg");
    await processImage({ inputPath: fixture, outputPath: out, width: 120, quality: 60 });
    const meta = await sharp(out).metadata();
    expect(meta.width).toBe(120);
    fs.unlinkSync(out);
  });
});