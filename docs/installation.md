# AssetForge Installation & Getting Started Guide

This guide will walk you through the installation process for AssetForge and help you get started with your first optimizations.

## System Requirements

- **Node.js**: Version 18 or higher
- **Operating System**: Windows, macOS, or Linux
- **Disk Space**: At least 200 MB (mostly for dependencies)
- **Memory**: Minimum 512 MB, recommended 1 GB or more for processing large files

## Installation Methods

### Method 1: Global Installation (Recommended for CLI usage)

Install AssetForge globally to use it from anywhere in your terminal:

```bash
npm install -g assetforge
```

After installation, verify it's working correctly:

```bash
assetforge --version
```

You should see the current version number displayed (e.g., `0.1.0`).

### Method 2: Local Project Installation

If you prefer to install AssetForge as a project dependency:

```bash
# Navigate to your project directory
cd your-project

# Install as a dependency
npm install assetforge

# Or as a dev dependency
npm install --save-dev assetforge
```

When installed locally, you can run it through npm scripts in your `package.json`:

```json
{
	"scripts": {
		"optimize-images": "assetforge image-batch -s ./src/images -d ./dist/images --format webp"
	}
}
```

Then run:

```bash
npm run optimize-images
```

### Method 3: Installation from GitHub

For the latest development version or to contribute:

```bash
git clone https://github.com/solaiman5683/AssetForge.git
cd AssetForge
npm install
```

When installed from source, run it using:

```bash
node src/cli.js image -i input.jpg -o output.webp
```

## First-time Setup

After installation, create a basic configuration file in your project directory:

```bash
echo '{ "image": { "quality": 80 }, "concurrency": 4 }' > assetforge.config.json
```

Or create it manually with more options:

```json
{
	"image": {
		"quality": 85,
		"defaultWidth": 1200
	},
	"concurrency": 4
}
```

## Getting Started with Common Tasks

### Optimizing a Single Image

```bash
# Convert to WebP with 80% quality
assetforge image -i original.jpg -o optimized.webp -q 80

# Resize an image to 800px width
assetforge image -i original.jpg -o resized.jpg -w 800

# Add a watermark
assetforge image -i original.jpg -o watermarked.jpg --watermark "© 2025"
```

### Batch Processing Images

```bash
# Create output directory if it doesn't exist
mkdir -p optimized-images

# Process all images in a folder, converting to WebP
assetforge image-batch -s ./original-images -d ./optimized-images --format webp -q 75
```

### Merging PDF Files

```bash
# Combine multiple PDFs
assetforge pdf merge -i chapter1.pdf chapter2.pdf chapter3.pdf -o complete-book.pdf
```

### Starting the UI Server

```bash
# Launch the UI
assetforge ui

# Then open http://localhost:5173 in your browser
```

## Troubleshooting Installation Issues

### Node.js Version Issues

If you encounter errors about incompatible Node.js versions:

```bash
# Check your Node.js version
node --version

# If below v18, install a newer version using nvm or the official installer
```

### Permission Errors on npm global install

If you see "EACCES" permission errors:

```bash
# Option 1: Use sudo (not recommended)
sudo npm install -g assetforge

# Option 2: Fix npm permissions (recommended)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
source ~/.profile
npm install -g assetforge
```

### Missing Dependencies

If you see errors about missing dependencies:

```bash
# Reinstall with the force option
npm install -g assetforge --force

# If specific to sharp or ffmpeg:
npm install -g sharp
```

## Project Setup Examples

### Basic Web Project

Create a simple workflow for optimizing web assets:

```bash
mkdir -p my-project/{src,dist}/{images,audio,json}
cd my-project

# Create config
cat > assetforge.config.json << EOL
{
  "image": {
    "quality": 75,
    "defaultWidth": 1200,
    "stripMetadata": true
  },
  "concurrency": 4
}
EOL

# Create a simple script
cat > optimize.sh << EOL
#!/bin/bash
assetforge image-batch -s ./src/images -d ./dist/images --format webp
assetforge svg -i ./src/logo.svg -o ./dist/logo.min.svg
EOL

chmod +x optimize.sh
```

### Integration with Build Tools

#### With npm scripts

```json
{
	"scripts": {
		"optimize:images": "assetforge image-batch -s ./src/images -d ./dist/images --format webp",
		"optimize:svg": "assetforge svg -i ./src/logo.svg -o ./dist/logo.min.svg",
		"optimize": "npm run optimize:images && npm run optimize:svg"
	}
}
```

#### With Gulp

```javascript
const { exec } = require('child_process');
const gulp = require('gulp');

function optimizeImages() {
	return new Promise((resolve, reject) => {
		exec(
			'assetforge image-batch -s ./src/images -d ./dist/images --format webp',
			(error, stdout, stderr) => {
				if (error) {
					console.error(`Error: ${stderr}`);
					reject(error);
				} else {
					console.log(stdout);
					resolve();
				}
			}
		);
	});
}

exports.optimizeImages = optimizeImages;
exports.default = gulp.series(optimizeImages);
```

## Docker Installation

You can also use AssetForge with Docker:

```dockerfile
FROM node:18

# Install AssetForge
RUN npm install -g assetforge

# Set working directory
WORKDIR /app

# Copy configuration
COPY assetforge.config.json .

# Command to run
CMD ["assetforge", "ui"]
```

Build and run:

```bash
docker build -t assetforge .
docker run -p 5173:5173 -v $(pwd):/app assetforge
```

## Next Steps

- Check out the [Command Reference](commands.md) for a complete list of available commands
- Learn about [Advanced Options](advanced-options.md) to customize your workflow
- Explore the [Configuration Guide](configuration.md) to set up project-specific settings
- Read the [API Documentation](api.md) if you want to integrate AssetForge into your code
