# AssetForge Command Reference

This document provides detailed information about all command-line options available in AssetForge.

## Global Options

These options are available for all commands:

| Option              | Description                                                                  |
| ------------------- | ---------------------------------------------------------------------------- |
| `--config <file>`   | Specify a custom configuration file path (default: `assetforge.config.json`) |
| `--concurrency <n>` | Set maximum parallel tasks (default: 3)                                      |
| `--quiet`           | Reduce console output                                                        |
| `--version`         | Display AssetForge version                                                   |
| `--help`            | Display help for command                                                     |

## Image Processing Commands

### `image` - Process a single image

Process an individual image with various optimization options.

```bash
assetforge image -i <input> -o <output> [options]
```

| Option                  | Description                                                    | Default                          |
| ----------------------- | -------------------------------------------------------------- | -------------------------------- |
| `-i, --input <file>`    | **Required.** Input image file path                            | -                                |
| `-o, --output <file>`   | **Required.** Output image file path                           | -                                |
| `-w, --width <pixels>`  | Resize width (height auto-calculated to maintain aspect ratio) | No resizing                      |
| `-q, --quality <1-100>` | Compression quality                                            | 80                               |
| `--format <fmt>`        | Output format (jpeg, png, webp, avif)                          | Determined from output extension |
| `--watermark <text>`    | Add text watermark                                             | No watermark                     |

Example:

```bash
assetforge image -i photo.jpg -o photo-optimized.webp -w 1200 -q 75 --watermark "© 2025"
```

### `image-batch` - Process multiple images

Process all images in a directory with the same settings.

```bash
assetforge image-batch -s <source-dir> -d <dest-dir> [options]
```

| Option                  | Description                                              | Default                  |
| ----------------------- | -------------------------------------------------------- | ------------------------ |
| `-s, --src <folder>`    | **Required.** Source directory containing images         | -                        |
| `-d, --dest <folder>`   | **Required.** Destination directory for processed images | -                        |
| `-w, --width <pixels>`  | Resize width                                             | No resizing              |
| `-q, --quality <1-100>` | Compression quality                                      | 80                       |
| `--format <fmt>`        | Output format override                                   | Maintain original format |
| `--watermark <text>`    | Add text watermark to all images                         | No watermark             |

Example:

```bash
assetforge image-batch -s ./photos -d ./optimized --format webp -q 80 -w 1600
```

## PDF Commands

### `pdf merge` - Combine PDF files

Merge multiple PDF documents into a single file.

```bash
assetforge pdf merge -i <file1> <file2> [<file3>...] -o <output>
```

| Option                    | Description                           | Default |
| ------------------------- | ------------------------------------- | ------- |
| `-i, --inputs <files...>` | **Required.** List of input PDF files | -       |
| `-o, --output <file>`     | **Required.** Output PDF file path    | -       |

Example:

```bash
assetforge pdf merge -i chapter1.pdf chapter2.pdf chapter3.pdf -o complete-book.pdf
```

### `pdf watermark` - Add text watermark to PDF

Add a text watermark to all pages of a PDF document.

```bash
assetforge pdf watermark -i <input> -o <output> --text <text>
```

| Option                | Description                        | Default |
| --------------------- | ---------------------------------- | ------- |
| `-i, --input <file>`  | **Required.** Input PDF file path  | -       |
| `-o, --output <file>` | **Required.** Output PDF file path | -       |
| `--text <text>`       | **Required.** Watermark text       | -       |

Example:

```bash
assetforge pdf watermark -i document.pdf -o watermarked.pdf --text "DRAFT - CONFIDENTIAL"
```

### `pdf split` - Split PDF (Placeholder)

_Note: This feature is a placeholder for future functionality._

```bash
assetforge pdf split -i <input>
```

## SVG Command

### `svg` - Optimize SVG file

Optimize an SVG file for web use by removing unnecessary elements and attributes.

```bash
assetforge svg -i <input> -o <output>
```

| Option                | Description                                  | Default |
| --------------------- | -------------------------------------------- | ------- |
| `-i, --input <file>`  | **Required.** Input SVG file path            | -       |
| `-o, --output <file>` | **Required.** Output optimized SVG file path | -       |

Example:

```bash
assetforge svg -i logo.svg -o logo.min.svg
```

## JSON Commands

### `json validate` - Check JSON validity

Validate a JSON file to ensure it's properly formatted.

```bash
assetforge json validate -f <file>
```

| Option              | Description                         | Default |
| ------------------- | ----------------------------------- | ------- |
| `-f, --file <file>` | **Required.** JSON file to validate | -       |

Example:

```bash
assetforge json validate -f config.json
```

### `json minify` - Minify JSON

Remove whitespace and create a compact version of a JSON file.

```bash
assetforge json minify -f <input> -o <output>
```

| Option                | Description                                  | Default |
| --------------------- | -------------------------------------------- | ------- |
| `-f, --file <file>`   | **Required.** Input JSON file path           | -       |
| `-o, --output <file>` | **Required.** Output minified JSON file path | -       |

Example:

```bash
assetforge json minify -f config.json -o config.min.json
```

### `json pretty` - Format JSON

Format a JSON file with proper indentation for improved readability.

```bash
assetforge json pretty -f <input> -o <output> [-s <spaces>]
```

| Option                | Description                                   | Default |
| --------------------- | --------------------------------------------- | ------- |
| `-f, --file <file>`   | **Required.** Input JSON file path            | -       |
| `-o, --output <file>` | **Required.** Output formatted JSON file path | -       |
| `-s, --spaces <n>`    | Number of spaces for indentation              | 2       |

Example:

```bash
assetforge json pretty -f data.min.json -o data.formatted.json -s 4
```

### `json diff` - Compare JSON files

Compare two JSON files and output structural differences.

```bash
assetforge json diff -a <fileA> -b <fileB>
```

| Option               | Description                         | Default |
| -------------------- | ----------------------------------- | ------- |
| `-a, --afile <file>` | **Required.** First JSON file path  | -       |
| `-b, --bfile <file>` | **Required.** Second JSON file path | -       |

Example:

```bash
assetforge json diff -a config.v1.json -b config.v2.json
```

## Audio Commands

### `audio convert` - Convert audio format

Convert audio from one format to another with optional bitrate adjustment.

```bash
assetforge audio convert -i <input> -o <output> [options]
```

| Option                | Description                           | Default                          |
| --------------------- | ------------------------------------- | -------------------------------- |
| `-i, --input <file>`  | **Required.** Input audio file path   | -                                |
| `-o, --output <file>` | **Required.** Output audio file path  | -                                |
| `--format <fmt>`      | Target format (ogg, mp3, webm, etc.)  | Determined from output extension |
| `--bitrate <br>`      | Target bitrate (e.g., "128k", "320k") | "128k"                           |

Example:

```bash
assetforge audio convert -i music.mp3 -o music.ogg --format ogg --bitrate 192k
```

### `audio trim` - Trim audio (Placeholder)

_Note: This feature is a placeholder for future functionality._

```bash
assetforge audio trim
```

## UI Command

### `ui` - Launch web interface

Start the local web server with drag-and-drop interface for asset optimization.

```bash
assetforge ui
```

After running this command, open `http://localhost:5173` in your web browser to access the interface.

Example:

```bash
assetforge ui
```

## Environment Variables

| Variable | Description                         | Default |
| -------- | ----------------------------------- | ------- |
| `PORT`   | Port for UI server                  | 5173    |
| `UI_LOG` | Enable verbose logging in UI server | false   |
