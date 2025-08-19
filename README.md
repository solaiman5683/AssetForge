# AssetForgeLocal

Local, private, multi‑asset optimization toolkit (no cloud).  
Supports Images, PDFs, Audio, SVG, JSON. Provides both a CLI and a lightweight local web UI.

## Features (MVP)
- Images: resize, format convert (jpeg/png/webp/avif), quality adjust, text watermark
- PDFs: merge, text watermark (all pages), (scaffold: split placeholder)
- Audio: convert (e.g. mp3 -> ogg/webm), re-encode with target bitrate (ffmpeg.wasm)
- SVG: optimized via SVGO
- JSON: validate, minify, pretty, structural diff
- Batch processing (images) with concurrency control
- Config file overrides defaults
- Local UI: drag & drop, queue, status, downloadable results
- Offline (all libraries local)

## Install
```bash
npm install -g assetforgelocal   # (after you publish)
# OR for local dev
git clone https://github.com/yourname/AssetForgeLocal
cd AssetForgeLocal
npm install
```

## CLI Usage
```bash
assetforge --help
assetforge image -i in.jpg -o out.webp -w 800 -q 70 --watermark "Demo"
assetforge image-batch -s ./imgs -d ./out --format webp --concurrency 4
assetforge pdf merge -i a.pdf b.pdf -o merged.pdf
assetforge pdf watermark -i in.pdf -o watermarked.pdf --text "CONFIDENTIAL"
assetforge svg -i logo.svg -o logo.min.svg
assetforge json validate -f data.json
assetforge json diff -a old.json -b new.json
assetforge audio convert -i input.mp3 -o out.ogg --bitrate 128k --format ogg
assetforge ui   # Launch local UI at http://localhost:5173
```

Global flags:
- `--config assetforge.config.json`
- `--concurrency <n>`
- `--quiet`

## Config File (Optional)
`assetforge.config.json`:
```json
{
  "image": { "quality": 82, "defaultWidth": 1200 },
  "concurrency": 4
}
```

## UI
```bash
assetforge ui
# Open browser http://localhost:5173
```
Drag files in, select options, process, download optimized assets.

## Tests
```bash
npm test
```

## Notes & Limitations
- Very large PDFs/images may spike memory; consider splitting batches.
- `ffmpeg.wasm` has startup overhead (first audio command may be slower).
- PDF compression is basic; pdf-lib does not perform aggressive stream re‑compression.
- Audio trimming/scissor stub included for future (currently placeholder).

## Roadmap Ideas
- Video support
- Persistent history & config in UI
- Image EXIF preservation toggle
- PDF split & page extraction finalize
- Worker threads for heavy batches
- Pluggable pipeline config

## Contributing
PRs welcome. Keep code additions concise & documented.

## License
MIT