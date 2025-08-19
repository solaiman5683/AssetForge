let ffmpegInstance;
import fs from "fs";
import path from "path";

export async function convertAudio({ input, output, format, bitrate = "128k" }) {
  const { FFmpeg } = await loadFF();
  const ffmpeg = await getFFmpeg();
  const data = fs.readFileSync(input);
  const inName = "in." + input.split(".").pop();
  const outName = "out." + (format || output.split(".").pop());
  await ffmpeg.writeFile(inName, new Uint8Array(data));
  await ffmpeg.exec(["-i", inName, "-b:a", bitrate, outName]);
  const outData = await ffmpeg.readFile(outName);
  fs.writeFileSync(output, Buffer.from(outData));
  return { output };
}

// Placeholder trim example
export async function trimAudioPlaceholder() {
  throw new Error("Audio trim not implemented yet.");
}

async function loadFF() {
  return await import("@ffmpeg/ffmpeg");
}
async function getFFmpeg() {
  if (!ffmpegInstance) {
    const { createFFmpeg } = await loadFF();
    ffmpegInstance = createFFmpeg({ log: false });
    if (!ffmpegInstance.isLoaded()) await ffmpegInstance.load();
  }
  return ffmpegInstance;
}