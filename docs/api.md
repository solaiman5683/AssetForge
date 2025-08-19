# AssetForge API Documentation

AssetForge can be used as a library in your Node.js applications. This document details how to integrate AssetForge's functionality into your own projects.

## Installation

```bash
npm install assetforge
```

## Importing

AssetForge is built with ES modules. Import the functions you need:

```javascript
import {
	processImage,
	mergePDFs,
	watermarkPDF,
	optimizeSVG,
	jsonTools,
	convertAudio,
} from 'assetforge';
```

## Image Processing

### `processImage(options)`

Process and optimize an image with various options.

```javascript
import { processImage } from 'assetforge';

await processImage({
	inputPath: 'path/to/input.jpg',
	outputPath: 'path/to/output.webp',
	format: 'webp', // 'jpeg', 'png', 'webp', 'avif', or 'auto'
	quality: 80, // 1-100
	width: 800, // undefined means no resizing
	stripMetadata: false, // true to remove EXIF data
	watermarkText: 'Copyright', // optional watermark
	watermarkOptions: {
		position: 'southeast', // northwest, north, northeast, west, center, east, southwest, south, southeast
		color: '#ffffff', // text color
		opacity: 0.35, // 0-1
		fontSize: 32, // auto-calculated if undefined
		stroke: true, // enable text stroke
		strokeColor: '#000000', // stroke color
		strokeWidth: 2, // stroke width
		scale: 0.6, // 0-1, relative to image width
	},
});
```

You can also use buffer input for in-memory processing:

```javascript
await processImage({
	inputBuffer: imageBuffer,
	outputPath: 'path/to/output.jpg',
	// other options remain the same
});
```

## PDF Operations

### `mergePDFs(inputPaths, outputPath)`

Merge multiple PDF files into a single PDF.

```javascript
import { mergePDFs } from 'assetforge';

await mergePDFs(
	['path/to/file1.pdf', 'path/to/file2.pdf', 'path/to/file3.pdf'],
	'path/to/merged.pdf'
);
```

### `watermarkPDF(inputPath, outputPath, text, options)`

Add a text watermark to all pages of a PDF.

```javascript
import { watermarkPDF } from 'assetforge';

await watermarkPDF(
	'path/to/input.pdf',
	'path/to/watermarked.pdf',
	'CONFIDENTIAL',
	{
		// options will be added in future versions
	}
);
```

## SVG Optimization

### `optimizeSVG(inputPath, outputPath)`

Optimize an SVG file, reducing its size.

```javascript
import { optimizeSVG } from 'assetforge';

const result = optimizeSVG('path/to/input.svg', 'path/to/output.svg');
console.log(`Original size: ${result.originalSize} bytes`);
console.log(`Optimized size: ${result.optimizedSize} bytes`);
console.log(`Saved: ${result.savedBytes} bytes (${result.savedPercentage}%)`);
```

## JSON Operations

The `jsonTools` object contains methods for working with JSON files.

### `jsonTools.validateFile(filePath)`

Validate a JSON file.

```javascript
import { jsonTools } from 'assetforge';

const result = jsonTools.validateFile('path/to/data.json');
if (result.valid) {
	console.log('JSON is valid');
} else {
	console.error('JSON validation error:', result.error);
}
```

### `jsonTools.minifyFile(inputPath, outputPath)`

Minify a JSON file.

```javascript
import { jsonTools } from 'assetforge';

jsonTools.minifyFile('path/to/input.json', 'path/to/minified.json');
```

### `jsonTools.prettyFile(inputPath, outputPath, spaces = 2)`

Format a JSON file with proper indentation.

```javascript
import { jsonTools } from 'assetforge';

jsonTools.prettyFile('path/to/input.json', 'path/to/pretty.json', 2);
```

### `jsonTools.diffFiles(filePathA, filePathB)`

Compare two JSON files and get a list of differences.

```javascript
import { jsonTools } from 'assetforge';

const differences = jsonTools.diffFiles('path/to/old.json', 'path/to/new.json');
differences.forEach(diff => {
	console.log(`Path: ${diff.path}, Old value: ${diff.a}, New value: ${diff.b}`);
});
```

## Audio Processing

### `convertAudio(options)`

Convert an audio file from one format to another.

```javascript
import { convertAudio } from 'assetforge';

await convertAudio({
	input: 'path/to/input.mp3',
	output: 'path/to/output.ogg',
	format: 'ogg', // target format
	bitrate: '128k', // target bitrate
});
```

## Error Handling

All AssetForge functions either return a result object or throw an Error with a descriptive message. Always wrap calls in try/catch blocks:

```javascript
try {
	await processImage({
		inputPath: 'input.jpg',
		outputPath: 'output.webp',
		format: 'webp',
	});
	console.log('Image processed successfully');
} catch (error) {
	console.error('Image processing failed:', error.message);
}
```

## Advanced Configuration

You can load configuration from a file and merge with defaults:

```javascript
import { loadConfig, mergeConfig } from 'assetforge';

const configFromFile = loadConfig('assetforge.config.json');
const defaultConfig = { image: { quality: 80 }, concurrency: 3 };
const effectiveConfig = mergeConfig(defaultConfig, configFromFile);

// Use effectiveConfig in your processing options
```

## Web UI Integration

If you want to integrate the AssetForge UI into your own server application:

```javascript
import { startServer } from 'assetforge/src/ui/server.js';

// Start the UI server on port 5173 (or specify another port)
const server = startServer(5173);
console.log('AssetForge UI available at http://localhost:5173');

// To stop the server later:
server.close();
```
