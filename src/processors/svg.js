import { optimize } from "svgo";
import fs from "fs";
export function optimizeSVG(inputPath, outputPath) {
  const data = fs.readFileSync(inputPath, "utf8");
  const result = optimize(data, {
    multipass: true,
    plugins: ["preset-default"]
  });
  fs.writeFileSync(outputPath, result.data, "utf8");
  return { outputPath, originalSize: data.length, optimizedSize: result.data.length };
}