import fs from "fs";
import path from "path";
import { jsonTools } from "../src/processors/json.js";

const sample = path.join(process.cwd(), "tests", "data.json");
beforeAll(() => {
  fs.writeFileSync(sample, JSON.stringify({ a: 1, b: { c: 2 } }));
});
afterAll(() => {
  if (fs.existsSync(sample)) fs.unlinkSync(sample);
});

test("validateFile", () => {
  const r = jsonTools.validateFile(sample);
  expect(r.valid).toBe(true);
});