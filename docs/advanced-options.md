# AssetForge Advanced Options

This document details the advanced configuration options available in AssetForge for each processor type.

## Configuration File

AssetForge uses a configuration file (`assetforge.config.json` by default) to customize default behavior. The configuration file can include settings for any of the processors and general operation parameters.

Example complete configuration file:

```json
{
	"image": {
		"quality": 85,
		"defaultWidth": 1600,
		"stripMetadata": true,
		"watermark": {
			"text": "© Company Name",
			"position": "southeast",
			"color": "#ffffff",
			"opacity": 0.4,
			"fontSize": 24,
			"stroke": true,
			"strokeColor": "#000000",
			"strokeWidth": 2,
			"scale": 0.5
		}
	},
	"pdf": {
		"watermark": {
			"text": "DRAFT",
			"fontSize": 48,
			"opacity": 0.3,
			"color": "#FF0000"
		}
	},
	"svg": {
		"precision": 2,
		"removeComments": true,
		"removeMetadata": true,
		"removeTitle": false
	},
	"json": {
		"indentSpaces": 2
	},
	"audio": {
		"defaultBitrate": "192k",
		"defaultFormat": "ogg"
	},
	"concurrency": 4,
	"tempDir": "./tmp"
}
```

## Image Processing Options

### Basic Options

| Option          | Type           | Default | Description                               |
| --------------- | -------------- | ------- | ----------------------------------------- |
| `quality`       | number (1-100) | 80      | Compression quality                       |
| `defaultWidth`  | number         | -       | Default resize width if not specified     |
| `stripMetadata` | boolean        | false   | Whether to remove EXIF and other metadata |

### Format-Specific Options

Different image formats have specific optimizations applied:

#### JPEG

```javascript
{
  mozjpeg: true,
  progressive: true,
  trellisQuantisation: true,
  overshootDeringing: true,
  optimizeScans: true
}
```

#### PNG

```javascript
{
  compressionLevel: 9,
  adaptiveFiltering: true,
  palette: true
}
```

#### WebP

```javascript
{
  quality: 80, // user-provided or default
  effort: 4    // processing effort (0-6)
}
```

#### AVIF

```javascript
{
  quality: 58, // mapped from user-provided quality
  effort: 4,
  chromaSubsampling: "4:2:0"
}
```

### Watermark Options

| Option        | Type         | Default     | Description                                                                                       |
| ------------- | ------------ | ----------- | ------------------------------------------------------------------------------------------------- |
| `text`        | string       | -           | Watermark text to display                                                                         |
| `position`    | string       | "southeast" | Watermark position (northwest, north, northeast, west, center, east, southwest, south, southeast) |
| `color`       | string       | "#ffffff"   | Text color in hex format                                                                          |
| `opacity`     | number (0-1) | 0.35        | Watermark opacity                                                                                 |
| `fontSize`    | number       | auto        | Font size in pixels (auto-calculated if not specified)                                            |
| `stroke`      | boolean      | false       | Whether to add stroke around text                                                                 |
| `strokeColor` | string       | "#000000"   | Stroke color in hex format                                                                        |
| `strokeWidth` | number       | 2           | Width of the stroke in pixels                                                                     |
| `scale`       | number (0-1) | 0.6         | Scale of watermark relative to image width                                                        |

## PDF Options

### Merge Options

No additional options are currently available for PDF merging.

### Watermark Options

| Option     | Type         | Default   | Description               |
| ---------- | ------------ | --------- | ------------------------- |
| `text`     | string       | -         | Watermark text            |
| `fontSize` | number       | 40        | Font size in points       |
| `opacity`  | number (0-1) | 0.3       | Text opacity              |
| `color`    | string       | "#000000" | Text color in hex format  |
| `angle`    | number       | -45       | Rotation angle in degrees |

## SVG Options

The SVG optimizer uses SVGO with the following configurable options:

| Option                | Type    | Default | Description                                |
| --------------------- | ------- | ------- | ------------------------------------------ |
| `precision`           | number  | 2       | Number of decimal places for coordinates   |
| `removeComments`      | boolean | true    | Remove comments                            |
| `removeMetadata`      | boolean | true    | Remove metadata elements                   |
| `removeTitle`         | boolean | false   | Remove title elements                      |
| `removeDesc`          | boolean | false   | Remove description elements                |
| `removeViewBox`       | boolean | false   | Remove viewBox attribute when possible     |
| `cleanupIDs`          | boolean | true    | Clean up IDs                               |
| `removeEmptyAttrs`    | boolean | true    | Remove empty attributes                    |
| `removeEmptyElements` | boolean | true    | Remove empty elements                      |
| `minifyStyles`        | boolean | true    | Minify style elements and style attributes |
| `convertStyleToAttrs` | boolean | true    | Convert styles to attributes               |
| `inlineStyles`        | boolean | true    | Inline styles                              |
| `sortAttrs`           | boolean | true    | Sort element attributes                    |

## JSON Options

| Option           | Type   | Default | Description                                         |
| ---------------- | ------ | ------- | --------------------------------------------------- |
| `indentSpaces`   | number | 2       | Number of spaces for indentation in pretty printing |
| `maxArrayLength` | number | 50      | Maximum array length to display in diffs            |

## Audio Options

| Option           | Type   | Default | Description           |
| ---------------- | ------ | ------- | --------------------- |
| `defaultBitrate` | string | "128k"  | Default audio bitrate |
| `defaultFormat`  | string | -       | Default audio format  |

## Advanced Command-Line Usage

### Using Environment Variables

You can set some options using environment variables:

```bash
PORT=8080 assetforge ui   # Run UI server on port 8080
UI_LOG=1 assetforge ui    # Enable verbose logging in UI server
```

### Processing Multiple File Types in Batch

While AssetForge provides specific batch processing for images, you can use shell scripting to batch process other file types:

```bash
# Batch convert multiple audio files (bash example)
for file in *.mp3; do
  assetforge audio convert -i "$file" -o "${file%.mp3}.ogg" --format ogg
done
```

```powershell
# Batch convert multiple audio files (PowerShell example)
Get-ChildItem -Filter "*.mp3" | ForEach-Object {
  assetforge audio convert -i $_.FullName -o ($_.FullName -replace '\.mp3$','.ogg') --format ogg
}
```

## Memory Management

For large files, you may need to increase Node.js memory limit:

```bash
NODE_OPTIONS="--max-old-space-size=4096" assetforge image-batch -s ./large-images -d ./output
```

## Custom Temporary Directory

By default, temporary files are stored in the `./tmp` directory. You can customize this location in the configuration file:

```json
{
	"tempDir": "/path/to/custom/temp/directory"
}
```

## UI Server Configuration

The UI server runs on port 5173 by default. To change this port:

```bash
PORT=8080 assetforge ui
```

Or in your JavaScript code:

```javascript
import { startServer } from 'assetforge/src/ui/server.js';
startServer(8080);
```
