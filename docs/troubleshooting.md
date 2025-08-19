# AssetForge Troubleshooting Guide

This guide helps you diagnose and fix common issues when using AssetForge.

## Table of Contents

- [General Issues](#general-issues)
- [Installation Problems](#installation-problems)
- [Image Processing Issues](#image-processing-issues)
- [PDF Processing Issues](#pdf-processing-issues)
- [SVG Issues](#svg-issues)
- [Audio Processing Issues](#audio-processing-issues)
- [JSON Tool Issues](#json-tool-issues)
- [UI Server Issues](#ui-server-issues)
- [Performance Problems](#performance-problems)
- [Getting Help](#getting-help)

## General Issues

### Command Not Found

**Symptom:** `assetforge: command not found`

**Solutions:**

1. Ensure AssetForge is installed: `npm list -g assetforge`
2. Check if npm bin directory is in your PATH:
   ```bash
   echo $PATH  # On macOS/Linux
   echo %PATH% # On Windows
   ```
3. Try using npx: `npx assetforge`

### Incorrect File Permissions

**Symptom:** Permission denied errors when accessing files

**Solution:** Ensure file permissions allow reading and writing:

```bash
# On macOS/Linux
chmod 644 input_file.jpg
```

## Installation Problems

### Node Version Incompatibility

**Symptom:** Error about Node.js version requirements

**Solution:** Upgrade to Node.js 18 or higher:

```bash
# Using nvm
nvm install 18
nvm use 18
```

### Sharp Installation Fails

**Symptom:** Sharp-related errors during installation

**Solution:** Try installing with specific Sharp version:

```bash
npm install -g assetforge --sharp-force-build
```

## Image Processing Issues

### Invalid Image Format

**Symptom:** "Invalid image format" or "unknown format" error

**Solutions:**

1. Check if the file is a valid image: `file your_image.jpg`
2. Try specifying the format explicitly: `--format jpeg`
3. Use another tool to convert to a standard format first:
   ```bash
   # Using ImageMagick
   convert problematic.tiff safe.jpg
   ```

### Memory Issues with Large Images

**Symptom:** Process crashes with "JavaScript heap out of memory"

**Solution:** Increase Node.js memory limit:

```bash
NODE_OPTIONS="--max-old-space-size=4096" assetforge image -i large.jpg -o output.jpg
```

### Watermarks Too Small/Large

**Symptom:** Text watermark size inappropriate for the image

**Solution:** Adjust watermark scale and font size:

```bash
assetforge image -i input.jpg -o output.jpg --watermark "Text" \
  --wm-scale 0.4 --wm-font 40
```

## PDF Processing Issues

### PDF Merge Fails

**Symptom:** Error when merging PDFs

**Solutions:**

1. Check if PDFs are valid: `assetforge pdf validate -i file.pdf`
2. Try with smaller batches of PDFs
3. Check if PDFs are password protected

### PDF Watermark Issues

**Symptom:** Watermark not showing or in wrong position

**Solution:** Verify PDF structure is standard:

```bash
# Use another tool temporarily to normalize
pdftk input.pdf output normalized.pdf
assetforge pdf watermark -i normalized.pdf -o watermarked.pdf --text "DRAFT"
```

## SVG Issues

### SVG Optimization Removes Important Elements

**Symptom:** SVG looks broken after optimization

**Solution:** Modify SVG optimization settings:

```json
// assetforge.config.json
{
	"svg": {
		"removeTitle": false,
		"removeViewBox": false,
		"cleanupIDs": false
	}
}
```

## Audio Processing Issues

### Audio Conversion Slow

**Symptom:** First audio conversion takes a long time

**Solution:** This is normal behavior for ffmpeg.wasm initialization. Subsequent conversions will be faster.

### Audio Format Not Supported

**Symptom:** "Format not supported" error

**Solution:** Convert to a standard format first:

```bash
# Using ffmpeg directly
ffmpeg -i exotic.aac -c:a libmp3lame temp.mp3
assetforge audio convert -i temp.mp3 -o output.ogg
```

## JSON Tool Issues

### JSON Validation Fails

**Symptom:** "Invalid JSON" error for seemingly valid file

**Solution:** Check for UTF-8 BOM or encoding issues:

```bash
# Remove BOM and fix encoding
iconv -f UTF-8 -t UTF-8 -o fixed.json input.json
```

## UI Server Issues

### UI Server Won't Start

**Symptom:** Error when starting the UI server

**Solutions:**

1. Check if port 5173 is already in use:
   ```bash
   # On macOS/Linux
   lsof -i :5173
   # On Windows
   netstat -ano | findstr :5173
   ```
2. Use a different port:
   ```bash
   PORT=8080 assetforge ui
   ```

### Upload Issues

**Symptom:** File uploads fail in the UI

**Solution:** Check file size and permissions on the tmp directory:

```bash
# Create tmp directory with proper permissions
mkdir -p tmp
chmod 755 tmp
```

## Performance Problems

### Slow Batch Processing

**Symptom:** Batch processing takes too long

**Solutions:**

1. Adjust concurrency:
   ```bash
   assetforge image-batch -s ./src -d ./dest --concurrency 8
   ```
2. Split into smaller batches
3. Use lower quality settings for faster processing:
   ```bash
   assetforge image-batch -s ./src -d ./dest -q 70
   ```

### Memory Usage High

**Symptom:** System becomes slow or unresponsive

**Solution:** Limit concurrent processing and monitor memory:

```bash
assetforge image-batch -s ./src -d ./dest --concurrency 2
```

## Getting Help

If you've tried the suggestions in this guide and still need help:

1. Check the [GitHub Issues](https://github.com/solaiman5683/AssetForge/issues) to see if your problem has been reported
2. Enable debugging for more information:
   ```bash
   DEBUG=1 assetforge command
   ```
3. Open a new issue with:
   - AssetForge version (`assetforge --version`)
   - Node.js version (`node --version`)
   - Operating system details
   - Complete error message
   - Steps to reproduce
