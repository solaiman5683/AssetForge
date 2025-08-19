# AssetForge

![AssetForge Logo](https://img.shields.io/badge/AssetForge-Local%20Asset%20Optimization-blue)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js >=18](https://img.shields.io/badge/Node.js-%3E%3D18-brightgreen)](https://nodejs.org/)

AssetForge is a powerful, local-first asset optimization toolkit for modern web development. Process and optimize various file formats offline without sending your data to the cloud.

## 🚀 Features

### Image Processing

- **Resize** images with automatic aspect ratio preservation
- **Convert formats** between JPEG, PNG, WebP, and AVIF
- **Optimize quality** for the perfect balance of size and visual fidelity
- **Add text watermarks** with customizable position, color, opacity, and more
- **Batch processing** with configurable concurrency

### PDF Tools

- **Merge multiple PDFs** into a single document
- **Add text watermarks** to all pages
- **Split PDFs** (planned feature)

### Audio Processing

- **Convert audio formats** (mp3, ogg, webm)
- **Adjust bitrates** for optimal file size
- **Audio trimming** (planned feature)

### SVG Optimization

- **Minify SVG files** for web use
- **Remove unnecessary elements** and attributes
- **Preserve viewBox** and important attributes

### JSON Tools

- **Validate** JSON files against schema
- **Minify** JSON for production
- **Prettify** JSON for development
- **Compare and diff** JSON files

### Local Web UI

- **Drag and drop** interface for easy file processing
- **Preview optimized assets** before downloading
- **No data leaves your machine** - 100% local processing

## 📋 Installation

```bash
# Install globally
npm install -g assetforge

# OR use directly from Git
git clone https://github.com/solaiman5683/AssetForge.git
cd AssetForge
npm install
```

## 💻 Command Line Usage

### Image Processing

```bash
# Basic image conversion with resizing and quality adjustment
assetforge image -i input.jpg -o output.webp -w 800 -q 75

# Add watermark
assetforge image -i input.jpg -o output.jpg -w 1200 -q 90 --watermark "© Copyright 2025"

# Process a whole folder of images
assetforge image-batch -s ./source-folder -d ./output-folder --format webp --quality 80
```

### PDF Operations

```bash
# Merge multiple PDFs
assetforge pdf merge -i document1.pdf document2.pdf document3.pdf -o merged.pdf

# Add watermark to all pages
assetforge pdf watermark -i document.pdf -o watermarked.pdf --text "CONFIDENTIAL"
```

### SVG Optimization

```bash
# Optimize SVG file
assetforge svg -i logo.svg -o optimized.svg
```

### JSON Tools

```bash
# Validate JSON
assetforge json validate -f data.json

# Minify JSON
assetforge json minify -f data.json -o data.min.json

# Format JSON
assetforge json pretty -f data.json -o data.pretty.json -s 2

# Compare JSON files
assetforge json diff -a file1.json -b file2.json
```

### Audio Processing

```bash
# Convert audio format
assetforge audio convert -i input.mp3 -o output.ogg --format ogg --bitrate 128k
```

### Launch UI Server

```bash
# Launch the web interface
assetforge ui
# Then open http://localhost:5173 in your browser
```

## ⚙️ Configuration

Create an `assetforge.config.json` file in your project directory to set default options:

```json
{
	"image": {
		"quality": 82,
		"defaultWidth": 1200
	},
	"concurrency": 4
}
```

Override config location with `--config path/to/config.json`.

## 🌐 Web UI

The AssetForge UI provides a user-friendly interface for all optimizations without requiring command line knowledge:

1. Run `assetforge ui`
2. Open `http://localhost:5173` in your browser
3. Drag files to process
4. Configure options
5. Download optimized results

## 📚 Documentation

- [API Documentation](./docs/api.md) - Using AssetForge programmatically
- [Advanced Options](./docs/advanced-options.md) - Detailed options for each processor
- [Command Reference](./docs/commands.md) - Complete CLI command reference
- [Configuration Guide](./docs/configuration.md) - Customizing AssetForge behavior

## 🧪 Testing

```bash
npm test
```

## 🛣️ Roadmap

- Video processing support
- PDF splitting and page extraction
- Audio trimming and effects
- Worker threads for improved performance
- Plugin system for extending functionality

## ⚠️ Limitations

- Large files may consume significant memory
- First audio conversion may be slower due to ffmpeg.wasm initialization
- Limited PDF compression capabilities
- Heavy batch processing may impact system performance

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
