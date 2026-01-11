const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

// Simple image processor using Sharp directly
async function processImageDirect(inputPath, outputPath, options) {
    // Dynamically import Sharp (it's a native module)
    const sharp = require('sharp');
    
    try {
        let img = sharp(inputPath);
        
        // Get metadata
        const metadata = await img.metadata();
        const originalSize = fs.statSync(inputPath).size;
        
        // Apply transformations
        if (options.width) {
            img = img.resize(options.width, null, {
                fit: 'inside',
                withoutEnlargement: true
            });
        }
        
        // Strip metadata if needed
        if (options.stripMetadata) {
            img = img.rotate(); // Auto-rotate based on EXIF then strip
        }
        
        // Output with format and quality
        const quality = options.quality || 80;
        const format = options.format || 'jpeg';
        
        switch (format.toLowerCase()) {
            case 'jpeg':
            case 'jpg':
                img = img.jpeg({ quality, mozjpeg: true });
                break;
            case 'png':
                img = img.png({ quality, compressionLevel: 9 });
                break;
            case 'webp':
                img = img.webp({ quality });
                break;
            case 'avif':
                img = img.avif({ quality: Math.max(25, Math.round(quality * 0.6)) });
                break;
            default:
                img = img.jpeg({ quality, mozjpeg: true });
        }
        
        // Save the file
        await img.toFile(outputPath);
        
        const optimizedSize = fs.statSync(outputPath).size;
        
        return {
            outputPath,
            format,
            originalSize,
            optimizedSize
        };
    } catch (error) {
        throw new Error(`Image processing failed: ${error.message}`);
    }
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
    const isDev = !app.isPackaged;
    let uiPath;
    if (isDev) {
        // Development: electron folder structure
        uiPath = path.join(__dirname, '../src/ui/index-desktop.html');
    } else {
        // Production: __dirname is already in resources/app, just add relative path
        uiPath = path.join(__dirname, 'src/ui/index-desktop.html');
    }
    console.log('[AssetForge] Loading UI from:', uiPath);
    mainWindow.loadFile(uiPath);

    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
}

// App lifecycle
app.whenReady().then(async () => {
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
        const outputPath = path.join(tempDir, `output_${Date.now()}_${fileName.replace(/\.[^.]+$/, '')}.${options.format || 'jpg'}`);

        // Write buffer to temp file
        fs.writeFileSync(inputPath, Buffer.from(fileBuffer));

        // Process image directly with Sharp
        const result = await processImageDirect(inputPath, outputPath, {
            width: options.width || null,
            quality: options.quality || 80,
            format: options.format || null,
            stripMetadata: options.stripMeta || false,
            watermarkText: options.watermark || null
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

// Save all files as ZIP
ipcMain.handle('save-zip', async (event, { files }) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: `optimized-images-${Date.now()}.zip`,
        filters: [
            { name: 'ZIP Archive', extensions: ['zip'] }
        ]
    });

    if (result.canceled) {
        return { success: false };
    }

    try {
        const output = fs.createWriteStream(result.filePath);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });

        return new Promise((resolve, reject) => {
            output.on('close', () => {
                resolve({ 
                    success: true, 
                    path: result.filePath,
                    size: archive.pointer() 
                });
            });

            archive.on('error', (err) => {
                reject(err);
            });

            archive.pipe(output);

            // Add each file to the archive
            files.forEach(file => {
                archive.append(Buffer.from(file.buffer), { name: file.name });
            });

            archive.finalize();
        });
    } catch (error) {
        return { success: false, error: error.message };
    }
});

console.log('[AssetForge Desktop] Ready');
