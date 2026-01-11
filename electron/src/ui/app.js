console.log("[UI] app.js loaded");
const $ = id => document.getElementById(id);

const widthEl = $("width");
const qualityEl = $("quality");
const formatEl = $("format");
const stripMetaEl = $("stripMeta");
const watermarkEl = $("watermark");
const wmPosEl = $("wm_position");
const wmColorEl = $("wm_color");
const wmOpacityEl = $("wm_opacity");
const wmFontEl = $("wm_font");
const wmStrokeEl = $("wm_stroke");

const concurrencyEl = $("concurrency");
const addBtn = $("addBtn");
const processBtn = $("processBtn");
const clearBtn = $("clearBtn");
const drop = $("drop");
const fileInput = $("fileInput");
const queueBody = $("queueBody");
const messages = $("messages");
const stats = $("stats");

let queue = []; // items: {id,file,status,progress,xhr,blobUrl,resultFormat,originalBytes,resultBytes}

function logMsg(msg, type = "info") {
  console.log("[UI]", msg);
  messages.style.color = type === "error" ? "#ef4444" : "#94a3b8";
  messages.textContent = msg;
}

function updateStats() {
  const total = queue.length;
  const doneItems = queue.filter(f => f.status === "done");
  const done = doneItems.length;
  const pending = queue.filter(f => f.status === "pending").length;
  const proc = queue.filter(f => f.status === "processing").length;
  const err = queue.filter(f => f.status === "error").length;

  let origBytes = 0;
  let resBytes = 0;
  doneItems.forEach(i => {
    if (typeof i.originalBytes === "number") origBytes += i.originalBytes;
    if (typeof i.resultBytes === "number") resBytes += i.resultBytes;
  });
  const savedBytes = origBytes - resBytes;
  const pct = origBytes > 0 ? (savedBytes / origBytes) * 100 : 0;

  stats.textContent = `${total} total | ${pending} pending | ${proc} processing | ${done} done | ${err} errors`
    + (done ? ` | Saved ${formatBytes(savedBytes)} (${pct.toFixed(1)}%)` : "");
}

function formatBytes(bytes) {
  if (bytes == null || isNaN(bytes)) return "-";
  const thresh = 1024;
  if (Math.abs(bytes) < thresh) return bytes + " B";
  const units = ["KB", "MB", "GB", "TB"];
  let u = -1;
  let val = bytes;
  do {
    val /= thresh;
    ++u;
  } while (Math.abs(val) >= thresh && u < units.length - 1);
  return val.toFixed(val >= 10 ? 0 : 1) + " " + units[u];
}

function addFiles(fileList) {
  let added = 0;
  for (const f of fileList) {
    if (queue.some(q => q.file.name === f.name && q.file.size === f.size)) continue;
    queue.push({
      id: uid(),
      file: f,
      status: "pending",
      progress: 0,
      requestedFormat: formatEl.value || "",
      originalBytesClient: f.size
    });
    added++;
  }
  if (!added) logMsg("No new files (duplicates skipped).");
  renderQueue();
  updateStats();
}

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function detectKind(file) {
  if (/image\//.test(file.type)) return "image";
  if (file.name.endsWith(".svg")) return "svg";
  if (file.name.endsWith(".json")) return "json";
  if (file.name.endsWith(".pdf")) return "pdf";
  if (/audio\//.test(file.type)) return "audio";
  return "other";
}

function endpointFor(file) {
  const k = detectKind(file);
  switch (k) {
    case "image": return "/api/image";
    case "svg": return "/api/svg";
    case "json": return "/api/json";
    case "pdf": return "/api/pdf";
    case "audio": return "/api/audio";
    default: return null;
  }
}

function renderQueue() {
  queueBody.innerHTML = "";
  for (const item of queue) {
    const tr = document.createElement("tr");
    tr.dataset.id = item.id;
    tr.innerHTML = `
      <td>${escapeHTML(item.file.name)}</td>
      <td>${detectKind(item.file)}</td>
      <td>${escapeHTML(item.requestedFormat || "(auto)")}</td>
      <td>${item.resultFormat ? escapeHTML(item.resultFormat) : "-"}</td>
      <td>${formatBytes(item.file.size)}</td>
      <td>${item.resultBytes != null ? formatBytes(item.resultBytes) : "-"}</td>
      <td>${item.resultBytes != null && item.originalBytes != null
        ? savingsCell(item.originalBytes, item.resultBytes)
        : "-"}</td>
      <td><div class="progress"><span style="width:${item.progress}%;"></span></div></td>
      <td class="status status-${item.status}">${item.status}</td>
      <td>${item.blobUrl ? `<a class="dl" href="${item.blobUrl}" download="${downloadName(item)}">Download</a>` : ""}</td>
      <td><button data-remove="${item.id}" ${item.status === "processing" ? "disabled" : ""}>✖</button></td>
    `;
    queueBody.appendChild(tr);
  }
}

function savingsCell(orig, res) {
  const saved = orig - res;
  const pct = orig > 0 ? (saved / orig) * 100 : 0;
  const sign = saved >= 0 ? "-" : "+";
  const pctTxt = (saved >= 0 ? pct : -pct).toFixed(1) + "%";
  return `${formatBytes(Math.abs(saved))} ${sign}${pctTxt}`;
}

queueBody.addEventListener("click", e => {
  const btn = e.target.closest("button[data-remove]");
  if (!btn) return;
  const id = btn.getAttribute("data-remove");
  const idx = queue.findIndex(q => q.id === id);
  if (idx >= 0) {
    const item = queue[idx];
    if (item.xhr && item.status === "processing") item.xhr.abort();
    queue.splice(idx, 1);
    renderQueue();
    updateStats();
  }
});

addBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  if (fileInput.files?.length) addFiles(fileInput.files);
  fileInput.value = "";
});

["dragenter", "dragover"].forEach(ev => {
  window.addEventListener(ev, e => {
    e.preventDefault();
    drop.classList.add("drag");
  });
});
["dragleave", "drop"].forEach(ev => {
  window.addEventListener(ev, e => {
    if (ev === "drop") return;
    if (!drop.contains(e.target)) drop.classList.remove("drag");
  });
});
window.addEventListener("drop", e => {
  e.preventDefault();
  drop.classList.remove("drag");
  if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
});

drop.addEventListener("click", () => fileInput.click());
drop.addEventListener("keydown", e => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fileInput.click();
  }
});

clearBtn.addEventListener("click", () => {
  queue = [];
  renderQueue();
  updateStats();
  logMsg("Queue cleared.");
});

processBtn.addEventListener("click", processQueue);

function processQueue() {
  const concurrency = Math.max(1, Math.min(4, parseInt(concurrencyEl.value, 10) || 1));
  const pending = queue.filter(i => i.status === "pending");
  if (!pending.length) return logMsg("Nothing to process.");
  logMsg("Processing " + pending.length + " file(s) with concurrency " + concurrency);
  let active = 0;
  function next() {
    const item = queue.find(i => i.status === "pending");
    if (!item) {
      if (active === 0) {
        logMsg("All done");
        updateStats();
      }
      return;
    }
    if (active >= concurrency) return;
    active++;
    runItem(item).finally(() => {
      active--;
      updateStats();
      next();
    });
    next();
  }
  next();
}

function runItem(item) {
  item.status = "processing";
  item.progress = 5;
  item.requestedFormat = formatEl.value || "";
  updateItemRow(item);
  const ep = endpointFor(item.file);
  if (!ep) {
    item.status = "error";
    updateItemRow(item);
    return Promise.resolve();
  }
  return new Promise(resolve => {
    const fd = new FormData();
    fd.append("file", item.file);
    if (widthEl.value) fd.append("width", widthEl.value);
    if (qualityEl.value) fd.append("quality", qualityEl.value);
    if (formatEl.value) fd.append("format", formatEl.value);
    if (stripMetaEl.value) fd.append("stripMeta", stripMetaEl.value);
    const wmScaleEl = document.getElementById("wm_scale");
    if (watermarkEl.value) {
      fd.append("watermark", watermarkEl.value);
      fd.append("wm_position", wmPosEl.value);
      fd.append("wm_color", wmColorEl.value);
      fd.append("wm_opacity", wmOpacityEl.value);
      fd.append("wm_font", wmFontEl.value);
      if (wmScaleEl && wmScaleEl.value) fd.append("wm_scale", wmScaleEl.value);
      if (wmStrokeEl.value) fd.append("wm_stroke", "1");
    }

    const xhr = new XMLHttpRequest();
    item.xhr = xhr;
    xhr.open("POST", ep);
    xhr.upload.onprogress = e => {
      if (e.lengthComputable) {
        item.progress = Math.min(60, Math.round((e.loaded / e.total) * 60));
        updateItemRow(item);
      }
    };
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          const blob = xhr.response;
          item.blobUrl = URL.createObjectURL(blob);
          item.status = "done";
          item.progress = 100;
          const fmt = xhr.getResponseHeader("X-Result-Format");
          if (fmt) item.resultFormat = fmt;
          const oBytes = xhr.getResponseHeader("X-Original-Bytes");
          const rBytes = xhr.getResponseHeader("X-Result-Bytes");
          if (oBytes) item.originalBytes = parseInt(oBytes, 10);
          if (rBytes) item.resultBytes = parseInt(rBytes, 10);
        } else {
          item.status = "error";
        }
        updateItemRow(item);
        updateStats();
        resolve();
      }
    };
    xhr.onerror = () => {
      item.status = "error";
      updateItemRow(item);
      updateStats();
      resolve();
    };
    xhr.responseType = "blob";
    xhr.send(fd);
  });
}

function updateItemRow(item) {
  const tr = queueBody.querySelector(`tr[data-id="${item.id}"]`);
  if (!tr) {
    renderQueue();
    return;
  }
  tr.querySelector(".progress span").style.width = item.progress + "%";
  const statusCell = tr.querySelector(".status");
  statusCell.textContent = item.status;
  statusCell.className = "status status-" + item.status;

  // Columns layout:
  // 0 name,1 type,2 requested,3 result format,4 original,5 optimized,6 saved,7 progress,8 status,9 download,10 remove
  if (item.resultFormat) tr.children[3].textContent = item.resultFormat;
  if (item.originalBytes != null) tr.children[4].textContent = formatBytes(item.originalBytes);
  if (item.resultBytes != null) tr.children[5].textContent = formatBytes(item.resultBytes);
  if (item.originalBytes != null && item.resultBytes != null) {
    tr.children[6].innerHTML = savingsCell(item.originalBytes, item.resultBytes);
  }
  if (item.blobUrl) {
    tr.children[9].innerHTML =
      `<a class="dl" href="${item.blobUrl}" download="${downloadName(item)}">Download</a>`;
  }
}

function downloadName(item) {
  const base = item.file.name.replace(/\.[^.]+$/, "");
  const ext = item.resultFormat === "jpeg" ? "jpg" : (item.resultFormat || "out");
  return `optimized-${base}.${ext}`;
}

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
  }[c]));
}

updateStats();
logMsg("UI ready.");