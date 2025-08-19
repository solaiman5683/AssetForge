import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";

export async function mergePDFs(inputs, output) {
  const outDoc = await PDFDocument.create();
  for (const file of inputs) {
    const bytes = fs.readFileSync(file);
    const srcDoc = await PDFDocument.load(bytes);
    const copied = await outDoc.copyPages(srcDoc, srcDoc.getPageIndices());
    copied.forEach(p => outDoc.addPage(p));
  }
  const outBytes = await outDoc.save();
  fs.writeFileSync(output, outBytes);
  return { output };
}

export async function watermarkPDF(input, output, text) {
  const bytes = fs.readFileSync(input);
  const doc = await PDFDocument.load(bytes);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  doc.getPages().forEach(page => {
    const { width, height } = page.getSize();
    page.drawText(text, {
      x: width / 2 - (text.length * 6),
      y: height / 2,
      size: 48,
      font,
      color: rgb(1, 0, 0),
      rotate: { type: "degrees", angle: 45 },
      opacity: 0.25
    });
  });
  const outBytes = await doc.save();
  fs.writeFileSync(output, outBytes);
  return { output };
}

// Placeholder split (future): define page ranges logic later
export async function splitPDFPlaceholder() {
  throw new Error("PDF split not implemented yet.");
}