// AssetForge Desktop - Electron Version
console.log("[AssetForge Desktop] Loading...");

// Check if we're in Electron
const isElectron = window.electronAPI && window.electronAPI.isDesktop;

if (!isElectron) {
    console.error("This app must run in Electron!");
}

// DOM Elements (same as web version)
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const fileItems = document.getElementById('fileItems');
const controlsPanel = document.getElementById('controlsPanel');
const processBtn = document.getElementById('processBtn');
const clearBtn = document.getElementById('clearBtn');
const addMoreBtn = document.getElementById('addMoreBtn');
const resultsSection = document.getElementById('resultsSection');
const resultsBody = document.getElementById('resultsBody');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const optimizeMoreBtn = document.getElementById('optimizeMoreBtn');
const messages = document.getElementById('messages');
const totalSavedEl = document.getElementById('totalSaved');
const percentSavedEl = document.getElementById('percentSaved');

const stepUpload = document.getElementById('stepUpload');
const stepConfigure = document.getElementById('stepConfigure');
const stepResults = document.getElementById('stepResults');

const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');

// Control elements
const widthEl = document.getElementById('width');
const qualityEl = document.getElementById('quality');
const formatEl = document.getElementById('format');
const stripMetaEl = document.getElementById('stripMeta');
const watermarkEl = document.getElementById('watermark');
const wmPosEl = document.getElementById('wm_position');
const wmColorEl = document.getElementById('wm_color');
const wmOpacityEl = document.getElementById('wm_opacity');
const wmFontEl = document.getElementById('wm_font');
const wmStrokeEl = document.getElementById('wm_stroke');
const concurrencyEl = document.getElementById('concurrency');

// State
let files = [];
let processedResults = [];

// Utility Functions
function formatBytes(bytes) {
    if (bytes == null || isNaN(bytes)) return "-";
    const thresh = 1024;
    if (Math.abs(bytes) < thresh) return bytes + " B";
    const units = ["KB", "MB", "GB"];
    let u = -1;
    let val = bytes;
    do {
        val /= thresh;
        ++u;
    } while (Math.abs(val) >= thresh && u < units.length - 1);
    return val.toFixed(val >= 10 ? 0 : 1) + " " + units[u];
}

function showMessage(msg, type = 'info') {
    messages.textContent = msg;
    messages.className = `message show ${type}`;
    setTimeout(() => {
        messages.classList.remove('show');
    }, 5000);
}

function updateSteps(currentStep) {
    [step1, step2, step3].forEach(step => step.classList.remove('active'));
    [stepUpload, stepConfigure, stepResults].forEach(step => step.classList.remove('active'));
    
    if (currentStep === 1) {
        step1.classList.add('active');
        stepUpload.classList.add('active');
    } else if (currentStep === 2) {
        step2.classList.add('active');
        stepConfigure.classList.add('active');
    } else if (currentStep === 3) {
        step3.classList.add('active');
        stepResults.classList.add('active');
    }
}

function getFileIcon(fileName) {
    const name = fileName.toLowerCase();
    if (name.match(/\.(jpg|jpeg|png|gif|webp|avif|bmp)$/)) return '🖼️';
    return '📁';
}

// File Management
async function addFilesFromElectron() {
    const selectedFiles = await window.electronAPI.selectFiles();
    
    if (selectedFiles.length === 0) return;
    
    selectedFiles.forEach(fileData => {
        const isDuplicate = files.some(f => 
            f.name === fileData.name && f.size === fileData.size
        );
        if (!isDuplicate) {
            files.push({
                id: Date.now() + Math.random(),
                name: fileData.name,
                size: fileData.size,
                buffer: fileData.buffer,
                file: null // Desktop doesn't use File objects
            });
        }
    });
    
    renderFileList();
    showControls();
    showMessage(`Added ${selectedFiles.length} image(s)`, 'success');
}

function addFiles(fileList) {
    const newFiles = Array.from(fileList);
    
    newFiles.forEach(file => {
        const isDuplicate = files.some(f => 
            f.name === file.name && f.size === file.size
        );
        if (!isDuplicate) {
            files.push({
                id: Date.now() + Math.random(),
                name: file.name,
                size: file.size,
                file: file,
                buffer: null
            });
        }
    });
    
    renderFileList();
    showControls();
}

function removeFile(id) {
    files = files.filter(f => f.id !== id);
    renderFileList();
    
    if (files.length === 0) {
        hideControls();
    }
}

function renderFileList() {
    if (files.length === 0) {
        fileList.classList.remove('show');
        fileItems.innerHTML = '';
        return;
    }
    
    fileList.classList.add('show');
    fileItems.innerHTML = files.map(f => `
        <div class="file-item">
            <div class="file-icon">${getFileIcon(f.name)}</div>
            <div class="file-info">
                <div class="file-name">${f.name}</div>
                <div class="file-size">${formatBytes(f.size)}</div>
            </div>
            <button class="file-remove" onclick="removeFile(${f.id})">×</button>
        </div>
    `).join('');
}

function showControls() {
    controlsPanel.classList.add('show');
    updateSteps(2);
}

function hideControls() {
    controlsPanel.classList.remove('show');
    resultsSection.classList.remove('show');
    updateSteps(1);
}

function clearAll() {
    files = [];
    processedResults = [];
    fileList.classList.remove('show');
    controlsPanel.classList.remove('show');
    resultsSection.classList.remove('show');
    fileItems.innerHTML = '';
    resultsBody.innerHTML = '';
    totalSavedEl.textContent = '0 MB';
    percentSavedEl.textContent = '0%';
    updateSteps(1);
}

// Process Files (Desktop version - calls Electron API)
async function processFiles() {
    if (files.length === 0) {
        showMessage('Please add images first', 'error');
        return;
    }
    
    processBtn.disabled = true;
    clearBtn.disabled = true;
    addMoreBtn.disabled = true;
    processedResults = [];
    resultsBody.innerHTML = '';
    resultsSection.classList.add('show');
    updateSteps(3);
    
    const options = {
        width: parseInt(widthEl.value) || null,
        quality: parseInt(qualityEl.value) || 80,
        format: formatEl.value || null,
        stripMeta: stripMetaEl.checked,
        watermark: watermarkEl.value || null,
        wm_position: wmPosEl.value || 'southeast',
        wm_color: wmColorEl.value || '#ffffff',
        wm_opacity: parseFloat(wmOpacityEl.value) || 0.5,
        wm_font: parseInt(wmFontEl.value) || 48,
        wm_stroke: parseInt(wmStrokeEl.value) || 2
    };
    
    showMessage('Processing images...', 'info');
    
    for (const fileItem of files) {
        await processFile(fileItem, options);
    }
    
    onAllComplete();
}

async function processFile(fileItem, options) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${fileItem.name}</td>
        <td>image</td>
        <td id="orig-${fileItem.id}">-</td>
        <td id="opt-${fileItem.id}">-</td>
        <td id="saved-${fileItem.id}">-</td>
        <td><div class="progress"><div class="progress-bar" id="prog-${fileItem.id}" style="width:0%"></div></div></td>
        <td><span class="status status-processing" id="status-${fileItem.id}">PROCESSING</span></td>
        <td><button class="download-btn" id="dl-${fileItem.id}" disabled>↓</button></td>
    `;
    resultsBody.appendChild(row);
    
    const progBar = document.getElementById(`prog-${fileItem.id}`);
    const statusEl = document.getElementById(`status-${fileItem.id}`);
    const dlBtn = document.getElementById(`dl-${fileItem.id}`);
    
    progBar.style.width = '30%';
    
    try {
        // Read file buffer if needed
        let buffer = fileItem.buffer;
        if (!buffer && fileItem.file) {
            buffer = Array.from(new Uint8Array(await fileItem.file.arrayBuffer()));
        }
        
        progBar.style.width = '60%';
        
        // Call Electron API to process image
        const result = await window.electronAPI.processImage(buffer, fileItem.name, options);
        
        progBar.style.width = '100%';
        
        if (result.success) {
            document.getElementById(`orig-${fileItem.id}`).textContent = formatBytes(result.originalSize);
            document.getElementById(`opt-${fileItem.id}`).textContent = formatBytes(result.optimizedSize);
            document.getElementById(`saved-${fileItem.id}`).textContent = formatBytes(result.saved) + ` (${Math.round((result.saved / result.originalSize) * 100)}%)`;
            
            statusEl.textContent = 'DONE';
            statusEl.className = 'status status-done';
            
            dlBtn.disabled = false;
            dlBtn.onclick = () => downloadFile(result, fileItem.name);
            
            processedResults.push(result);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Processing error:', error);
        statusEl.textContent = 'ERROR';
        statusEl.className = 'status status-error';
        showMessage(`Error processing ${fileItem.name}: ${error.message}`, 'error');
    }
}

async function downloadFile(result, originalName) {
    const ext = result.format || 'jpg';
    const fileName = originalName.replace(/\.[^/.]+$/, "") + `.${ext}`;
    
    const saved = await window.electronAPI.saveFile(fileName, result.buffer);
    
    if (saved.success) {
        showMessage(`Saved: ${fileName}`, 'success');
    } else {
        showMessage('Save cancelled', 'info');
    }
}

async function downloadAllFiles() {
    if (processedResults.length === 0) {
        showMessage('No processed files to download', 'error');
        return;
    }
    
    showMessage('Creating ZIP file...', 'info');
    
    // Prepare files for ZIP
    const filesToZip = processedResults.map((result, index) => {
        const originalName = files[index]?.name || `image-${index + 1}`;
        const ext = result.format || 'jpg';
        const fileName = originalName.replace(/\.[^/.]+$/, "") + `.${ext}`;
        
        return {
            name: fileName,
            buffer: result.buffer
        };
    });
    
    const saved = await window.electronAPI.saveZip(filesToZip);
    
    if (saved.success) {
        showMessage(`Saved ${processedResults.length} image(s) as ZIP (${formatBytes(saved.size)})`, 'success');
    } else {
        showMessage('Save cancelled', 'info');
    }
}

function onAllComplete() {
    processBtn.disabled = false;
    clearBtn.disabled = false;
    addMoreBtn.disabled = false;
    
    const totalOriginal = processedResults.reduce((sum, r) => sum + r.originalSize, 0);
    const totalOptimized = processedResults.reduce((sum, r) => sum + r.optimizedSize, 0);
    const totalSaved = totalOriginal - totalOptimized;
    const percentSaved = totalOriginal > 0 ? Math.round((totalSaved / totalOriginal) * 100) : 0;
    
    totalSavedEl.textContent = formatBytes(totalSaved);
    percentSavedEl.textContent = percentSaved + '%';
    
    showMessage(`Processed ${processedResults.length} image(s) successfully!`, 'success');
}

// Event Listeners
processBtn.addEventListener('click', processFiles);
clearBtn.addEventListener('click', clearAll);
downloadAllBtn.addEventListener('click', downloadAllFiles);

addMoreBtn.addEventListener('click', async () => {
    await addFilesFromElectron();
});

optimizeMoreBtn.addEventListener('click', () => {
    clearAll();
    showMessage('Ready for new images!', 'info');
});

// Drop Zone
dropZone.addEventListener('click', async () => {
    await addFilesFromElectron();
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag');
});

dropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag');
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => 
        f.type.startsWith('image/')
    );
    
    if (droppedFiles.length > 0) {
        addFiles(droppedFiles);
    }
});

// Make removeFile globally available
window.removeFile = removeFile;

console.log('[AssetForge Desktop] Ready! Click to select images or drag & drop.');
