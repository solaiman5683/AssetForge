const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Import your existing processors
let processImage, optimizeSVG, normalizeWatermarkText;

// Load ES modules
async function loadProcessors() {
    const imageModule = await import('../src/processors/image.js');
    const svgModule = await import('../src/processors/svg.js');
    const watermarkModule = await import('../src/utils/watermark.js');
    
    processImage = imageModule.processImage;
    optimizeSVG = svgModule.optimizeSVG;
    normalizeWatermarkText = watermarkModule.normalizeWatermarkText;
}

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false
        },
        autoHideMenuBar: true,
        backgroundColor: '#0f172a'
    });

    // Load the UI
    mainWindow.loadFile(path.join(__dirname, '../src/ui/index-desktop.html'));

    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
}

// App lifecycle
app.whenReady().then(async () => {
    await loadProcessors();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC Handlers for image processing
ipcMain.handle('process-image', async (event, { fileBuffer, fileName, options }) => {
    try {
        const tempDir = app.getPath('temp');
        const inputPath = path.join(tempDir, `input_${Date.now()}_${fileName}`);
        const outputPath = path.join(tempDir, `output_${Date.now()}_${fileName}`);

        // Write buffer to temp file
        fs.writeFileSync(inputPath, Buffer.from(fileBuffer));

        // Process image using your existing processor
        const result = await processImage({
            inputPath: inputPath,
            outputPath: outputPath,
            width: options.width || null,
            quality: options.quality || 80,
            format: options.format || null,
            stripMetadata: options.stripMeta || false,
            watermarkText: options.watermark || null,
            watermarkOptions: {
                position: options.wm_position || 'southeast',
                color: options.wm_color || '#ffffff',
                opacity: options.wm_opacity || 0.5,
                fontSize: options.wm_font || 48,
                stroke: options.wm_stroke || 2
            }
        });

        // Get file sizes
        const originalSize = fs.statSync(inputPath).size;
        
        // Read processed file
        const outputBuffer = fs.readFileSync(result.outputPath);
        const optimizedSize = outputBuffer.length;

        // Cleanup temp files
        try {
            fs.unlinkSync(inputPath);
            fs.unlinkSync(result.outputPath);
        } catch (e) {
            // Ignore cleanup errors
        }

        return {
            success: true,
            buffer: Array.from(outputBuffer),
            originalSize: originalSize,
            optimizedSize: optimizedSize,
            saved: originalSize - optimizedSize,
            format: result.format
        };
    } catch (error) {
        console.error('Image processing error:', error);
        return {
            success: false,
            error: error.message
        };
    }
});

// Select files dialog
ipcMain.handle('select-files', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [
            { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'bmp', 'tiff'] }
        ]
    });

    if (result.canceled) {
        return [];
    }

    return result.filePaths.map(filePath => {
        const buffer = fs.readFileSync(filePath);
        return {
            name: path.basename(filePath),
            size: buffer.length,
            buffer: Array.from(buffer)
        };
    });
});

// Save file dialog
ipcMain.handle('save-file', async (event, { fileName, buffer }) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: fileName,
        filters: [
            { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'] }
        ]
    });

    if (result.canceled) {
        return { success: false };
    }

    try {
        fs.writeFileSync(result.filePath, Buffer.from(buffer));
        return { success: true, path: result.filePath };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

console.log('[AssetForge Desktop] Ready');
