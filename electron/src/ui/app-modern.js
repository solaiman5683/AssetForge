// AssetForge - Modern Event-Driven UI
console.log("[AssetForge] Modern UI loaded");

// DOM Elements
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

// Step containers
const stepUpload = document.getElementById('stepUpload');
const stepConfigure = document.getElementById('stepConfigure');
const stepResults = document.getElementById('stepResults');

// Step indicators
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

function getFileIcon(file) {
    const name = file.name.toLowerCase();
    if (name.match(/\.(jpg|jpeg|png|gif|webp|avif|bmp)$/)) return '🖼️';
    if (name.match(/\.svg$/)) return '⚡';
    if (name.match(/\.pdf$/)) return '📄';
    if (name.match(/\.(mp3|ogg|webm|wav)$/)) return '🎵';
    if (name.match(/\.json$/)) return '📝';
    return '📁';
}

function detectKind(file) {
    if (/image\//.test(file.type)) return "image";
    if (file.name.endsWith(".svg")) return "svg";
    if (file.name.endsWith(".json")) return "json";
    if (file.name.endsWith(".pdf")) return "pdf";
    if (/audio\//.test(file.type)) return "audio";
    return "other";
}

// File Management
function addFiles(fileList) {
    const newFiles = Array.from(fileList);
    
    // Filter out duplicates
    newFiles.forEach(file => {
        const isDuplicate = files.some(f => 
            f.name === file.name && f.size === file.size
        );
        if (!isDuplicate) {
            files.push({
                file: file,
                id: Date.now() + Math.random(),
                status: 'pending',
                progress: 0
            });
        }
    });
    
    if (files.length > 0) {
        renderFileList();
        showControls();
        showMessage(`${files.length} file(s) added. Configure settings and click Process.`, 'success');
    }
}

function removeFile(id) {
    files = files.filter(f => f.id !== id);
    if (files.length === 0) {
        hideControls();
        fileList.classList.remove('show');
        updateSteps(1);
    }
    renderFileList();
}

function renderFileList() {
    if (files.length === 0) {
        fileList.classList.remove('show');
        return;
    }
    
    fileList.classList.add('show');
    fileItems.innerHTML = files.map(f => `
        <div class="file-item" data-id="${f.id}">
            <div class="file-icon">${getFileIcon(f.file)}</div>
            <div class="file-info">
                <div class="file-name">${escapeHTML(f.file.name)}</div>
                <div class="file-size">${formatBytes(f.file.size)}</div>
            </div>
            <button class="file-remove" onclick="removeFile('${f.id}')">×</button>
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
    updateSteps(1);
    showMessage('All files cleared', 'info');
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Drop Zone Events
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag');
    if (e.dataTransfer.files.length) {
        addFiles(e.dataTransfer.files);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        addFiles(e.target.files);
    }
});

// Process Files
async function processFiles() {
    if (files.length === 0) {
        showMessage('Please add files first', 'error');
        return;
    }
    
    processBtn.disabled = true;
    clearBtn.disabled = true;
    processedResults = [];
    resultsBody.innerHTML = '';
    resultsSection.classList.add('show');
    updateSteps(3);
    
    const concurrency = parseInt(concurrencyEl.value) || 3;
    const queue = [...files];
    let active = 0;
    let completed = 0;
    
    const processNext = () => {
        while (active < concurrency && queue.length > 0) {
            const fileItem = queue.shift();
            active++;
            processFile(fileItem).finally(() => {
                active--;
                completed++;
                if (completed === files.length) {
                    onAllComplete();
                }
                processNext();
            });
        }
    };
    
    processNext();
}

async function processFile(fileItem) {
    const { file, id } = fileItem;
    
    // Add row to results table
    const row = document.createElement('tr');
    row.id = `result-${id}`;
    row.innerHTML = `
        <td>${escapeHTML(file.name)}</td>
        <td>${detectKind(file)}</td>
        <td>${formatBytes(file.size)}</td>
        <td id="size-${id}">-</td>
        <td id="saved-${id}">-</td>
        <td>
            <div class="progress">
                <div class="progress-bar" id="progress-${id}" style="width: 0%"></div>
            </div>
        </td>
        <td><span class="status status-processing">Processing</span></td>
        <td id="download-${id}">-</td>
    `;
    resultsBody.appendChild(row);
    
    const endpoint = getEndpoint(file);
    if (!endpoint) {
        updateResult(id, 'error', 'Unsupported file type');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    // Add processing options
    if (detectKind(file) === 'image') {
        if (widthEl.value) formData.append('width', widthEl.value);
        if (qualityEl.value) formData.append('quality', qualityEl.value);
        if (formatEl.value) formData.append('format', formatEl.value);
        if (stripMetaEl.checked) formData.append('stripMeta', '1');
        if (watermarkEl.value) {
            formData.append('watermark', watermarkEl.value);
            formData.append('wm_position', wmPosEl.value);
            formData.append('wm_color', wmColorEl.value);
            formData.append('wm_opacity', wmOpacityEl.value);
            formData.append('wm_font', wmFontEl.value);
            formData.append('wm_stroke', wmStrokeEl.checked ? '1' : '0');
        }
    }
    
    try {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percent = (e.loaded / e.total) * 100;
                document.getElementById(`progress-${id}`).style.width = percent + '%';
            }
        });
        
        const response = await new Promise((resolve, reject) => {
            xhr.open('POST', endpoint);
            xhr.responseType = 'blob';
            
            xhr.onload = () => {
                if (xhr.status === 200) {
                    resolve(xhr);
                } else {
                    reject(new Error(xhr.statusText || 'Processing failed'));
                }
            };
            
            xhr.onerror = () => reject(new Error('Network error'));
            xhr.send(formData);
        });
        
        const blob = response.response;
        const originalBytes = parseInt(response.getResponseHeader('X-Original-Bytes')) || file.size;
        const resultBytes = parseInt(response.getResponseHeader('X-Result-Bytes')) || blob.size;
        const bytesSaved = originalBytes - resultBytes;
        const percentSaved = originalBytes > 0 ? (bytesSaved / originalBytes) * 100 : 0;
        const resultFormat = response.getResponseHeader('X-Result-Format') || '';
        const originalName = decodeURIComponent(response.getResponseHeader('X-Original-Name') || file.name);
        
        // Create download URL
        const blobUrl = URL.createObjectURL(blob);
        const downloadName = resultFormat 
            ? originalName.replace(/\.[^.]+$/, `.${resultFormat}`)
            : originalName;
        
        processedResults.push({
            id,
            blob,
            blobUrl,
            downloadName,
            originalBytes,
            resultBytes,
            bytesSaved
        });
        
        // Update UI
        document.getElementById(`size-${id}`).textContent = formatBytes(resultBytes);
        document.getElementById(`saved-${id}`).innerHTML = `
            <span style="color: #10b981; font-weight: 600;">
                ${formatBytes(Math.abs(bytesSaved))} (${Math.abs(percentSaved).toFixed(1)}%)
            </span>
        `;
        document.getElementById(`progress-${id}`).style.width = '100%';
        document.getElementById(`download-${id}`).innerHTML = `
            <a href="${blobUrl}" download="${downloadName}" class="download-btn">
                📥 Download
            </a>
        `;
        
        const statusEl = row.querySelector('.status');
        statusEl.className = 'status status-done';
        statusEl.textContent = 'Done';
        
    } catch (error) {
        console.error('Processing error:', error);
        updateResult(id, 'error', error.message);
    }
}

function updateResult(id, status, message) {
    const statusEl = document.querySelector(`#result-${id} .status`);
    if (statusEl) {
        statusEl.className = `status status-${status}`;
        statusEl.textContent = status === 'error' ? 'Error' : status;
    }
    
    if (status === 'error') {
        document.getElementById(`download-${id}`).innerHTML = `<span style="color: #ef4444; font-size: 0.85rem;">${escapeHTML(message)}</span>`;
    }
}

function onAllComplete() {
    processBtn.disabled = false;
    clearBtn.disabled = false;
    
    // Calculate totals
    let totalOriginal = 0;
    let totalResult = 0;
    
    processedResults.forEach(r => {
        totalOriginal += r.originalBytes || 0;
        totalResult += r.resultBytes || 0;
    });
    
    const totalSaved = totalOriginal - totalResult;
    const percentSaved = totalOriginal > 0 ? (totalSaved / totalOriginal) * 100 : 0;
    
    totalSavedEl.textContent = formatBytes(totalSaved);
    percentSavedEl.textContent = Math.abs(percentSaved).toFixed(1) + '%';
    
    showMessage(`Processing complete! Saved ${formatBytes(totalSaved)} total.`, 'success');
}

function getEndpoint(file) {
    const kind = detectKind(file);
    switch (kind) {
        case 'image': return '/api/image';
        case 'svg': return '/api/svg';
        case 'json': return '/api/json';
        case 'audio': return '/api/audio';
        case 'pdf': return '/api/pdf';
        default: return null;
    }
}

// Download All Files
async function downloadAllFiles() {
    if (processedResults.length === 0) {
        showMessage('No files to download', 'error');
        return;
    }
    
    showMessage('Preparing download...', 'info');
    
    // If only one file, download directly
    if (processedResults.length === 1) {
        const result = processedResults[0];
        const a = document.createElement('a');
        a.href = result.blobUrl;
        a.download = result.downloadName;
        a.click();
        return;
    }
    
    // For multiple files, download one by one with small delay
    for (let i = 0; i < processedResults.length; i++) {
        const result = processedResults[i];
        const a = document.createElement('a');
        a.href = result.blobUrl;
        a.download = result.downloadName;
        a.click();
        
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    showMessage(`Downloaded ${processedResults.length} files!`, 'success');
}

// Event Listeners
processBtn.addEventListener('click', processFiles);
clearBtn.addEventListener('click', clearAll);
downloadAllBtn.addEventListener('click', downloadAllFiles);
addMoreBtn.addEventListener('click', () => {
    fileInput.click();
});
optimizeMoreBtn.addEventListener('click', () => {
    // Reset to step 1
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
    showMessage('Ready for new images!', 'info');
});

// Make removeFile globally available
window.removeFile = removeFile;

console.log('[AssetForge] Ready! Drop files to get started.');
