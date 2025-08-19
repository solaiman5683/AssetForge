# AssetForge Configuration Guide

AssetForge can be customized through a configuration file that allows you to set default values for all operations. This guide explains how to create and use configuration files effectively.

## Configuration File Basics

The default configuration file is named `assetforge.config.json` and should be placed in your project's root directory. You can also specify a different file path using the `--config` command-line option.

```bash
assetforge --config ./custom-config.json image -i input.jpg -o output.webp
```

## Configuration Structure

The configuration file is a JSON object with sections for each processor type and general options.

Here's a basic example:

```json
{
	"image": {
		"quality": 85,
		"defaultWidth": 1200
	},
	"concurrency": 4
}
```

## Complete Configuration Reference

Below is a complete reference showing all available configuration options:

```json
{
	"image": {
		"quality": 82,
		"defaultWidth": 1200,
		"stripMetadata": false,
		"watermark": {
			"text": "© Copyright",
			"position": "southeast",
			"color": "#ffffff",
			"opacity": 0.35,
			"fontSize": 32,
			"stroke": true,
			"strokeColor": "#000000",
			"strokeWidth": 2,
			"scale": 0.6
		}
	},
	"pdf": {
		"watermark": {
			"text": "CONFIDENTIAL",
			"fontSize": 40,
			"opacity": 0.3,
			"color": "#FF0000",
			"angle": -45
		}
	},
	"svg": {
		"precision": 2,
		"removeComments": true,
		"removeMetadata": true
	},
	"json": {
		"indentSpaces": 2,
		"maxArrayLength": 50
	},
	"audio": {
		"defaultBitrate": "128k",
		"defaultFormat": "ogg"
	},
	"concurrency": 4,
	"tempDir": "./tmp"
}
```

## Configuration Priority

The priority of settings is as follows (from highest to lowest):

1. Command-line arguments
2. Configuration file settings
3. Default values

This means that any options specified directly in the command will override the values in the configuration file.

## Configuration File Loading

AssetForge looks for the configuration file in the following order:

1. The path specified with the `--config` option
2. `assetforge.config.json` in the current working directory

## Creating Configuration Profiles

You can create multiple configuration profiles for different scenarios:

### Production Profile

```json
// assetforge.prod.json
{
	"image": {
		"quality": 65,
		"defaultWidth": 800,
		"stripMetadata": true
	},
	"concurrency": 8
}
```

### Development Profile

```json
// assetforge.dev.json
{
	"image": {
		"quality": 90,
		"defaultWidth": 1600,
		"stripMetadata": false
	},
	"concurrency": 2
}
```

Then use them with:

```bash
assetforge --config assetforge.prod.json image-batch -s ./images -d ./dist
```

## Environment-specific Configuration

You can load different configuration files based on environment variables:

```bash
ENV=production assetforge --config assetforge.$ENV.json image-batch -s ./images -d ./dist
```

## Automating Configuration Selection

Here's an example of a shell script that selects the appropriate configuration:

```bash
#!/bin/bash
# select-config.sh

if [ "$NODE_ENV" == "production" ]; then
  CONFIG="assetforge.prod.json"
elif [ "$NODE_ENV" == "staging" ]; then
  CONFIG="assetforge.staging.json"
else
  CONFIG="assetforge.dev.json"
fi

assetforge --config $CONFIG "$@"
```

Then you can use this script:

```bash
NODE_ENV=production ./select-config.sh image-batch -s ./images -d ./dist
```

## Programmatic Configuration

When using AssetForge as a library in your Node.js applications, you can load and merge configurations programmatically:

```javascript
import { loadConfig, mergeConfig } from 'assetforge';
import path from 'path';

// Load configuration from file
const env = process.env.NODE_ENV || 'development';
const configPath = path.join(process.cwd(), `assetforge.${env}.json`);
const fileConfig = loadConfig(configPath);

// Default configuration
const defaultConfig = {
	image: { quality: 80 },
	concurrency: 3,
};

// Custom overrides
const overrides = {
	image: { stripMetadata: true },
};

// Merge configurations (later objects override earlier ones)
const finalConfig = mergeConfig(defaultConfig, fileConfig, overrides);

console.log('Using configuration:', finalConfig);
```

## Sharing Configurations

You can share configurations across teams by storing them in your version control system. This ensures consistent asset processing across all development environments.

## Validating Configuration

While AssetForge doesn't include built-in configuration validation, you can use tools like JSON Schema to validate your configuration files:

```javascript
import Ajv from 'ajv';
import fs from 'fs';

const ajv = new Ajv();
const schema = {
	type: 'object',
	properties: {
		image: {
			type: 'object',
			properties: {
				quality: { type: 'number', minimum: 1, maximum: 100 },
				defaultWidth: { type: 'number', minimum: 1 },
			},
		},
		concurrency: { type: 'number', minimum: 1 },
	},
};

const validate = ajv.compile(schema);
const config = JSON.parse(fs.readFileSync('assetforge.config.json', 'utf8'));
const valid = validate(config);

if (!valid) {
	console.error('Invalid configuration:', validate.errors);
	process.exit(1);
}
```

## Best Practices

1. **Start simple**: Begin with just the options you need to customize
2. **Use comments**: Some JSON parsers support comments; use them to explain configuration choices
3. **Version your configs**: Keep configuration files in version control
4. **Separate environments**: Create different configurations for development, staging, and production
5. **Document changes**: When changing configuration, document why changes were made
6. **Validate configs**: Consider validating configurations against a schema before using them

## Troubleshooting

If your configuration doesn't seem to be applied:

1. Confirm the configuration file exists in the expected location
2. Check for JSON syntax errors
3. Use the `--config` option with an absolute path to ensure the correct file is loaded
4. Add logging to see the actual configuration values being used

Example debugging script:

```javascript
import { loadConfig } from 'assetforge';

const config = loadConfig('assetforge.config.json');
console.log(JSON.stringify(config, null, 2));
```

## Example Configurations for Common Scenarios

### Web Optimization Profile

```json
{
	"image": {
		"quality": 75,
		"defaultWidth": 1200,
		"stripMetadata": true
	},
	"concurrency": 4
}
```

### High-Quality Print Profile

```json
{
	"image": {
		"quality": 95,
		"defaultWidth": 3000,
		"stripMetadata": false
	},
	"concurrency": 2
}
```

### Social Media Assets Profile

```json
{
	"image": {
		"quality": 85,
		"defaultWidth": 1800,
		"stripMetadata": true,
		"watermark": {
			"text": "© YourBrand",
			"position": "southeast",
			"opacity": 0.3,
			"stroke": true
		}
	},
	"concurrency": 4
}
```
