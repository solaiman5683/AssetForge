const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    processImage: (fileBuffer, fileName, options) => 
        ipcRenderer.invoke('process-image', { fileBuffer, fileName, options }),
    
    selectFiles: () => 
        ipcRenderer.invoke('select-files'),
    
    saveFile: (fileName, buffer) => 
        ipcRenderer.invoke('save-file', { fileName, buffer }),
    
    saveZip: (files) => 
        ipcRenderer.invoke('save-zip', { files }),
    
    platform: process.platform,
    
    isDesktop: true
});

console.log('[AssetForge] Preload script loaded');
