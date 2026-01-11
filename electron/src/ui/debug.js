const fInput = document.getElementById("f");
const log = m => {
  const d = document.createElement("div"); d.textContent = m;
  document.getElementById("log").appendChild(d);
};
document.getElementById("go").addEventListener("click", async () => {
  const file = fInput.files?.[0];
  if (!file) return log("No file selected.");
  const form = new FormData();
  form.append("file", file);
  form.append("quality", 70);
  try {
    const r = await fetch("/api/image", { method: "POST", body: form });
    log("Status: " + r.status);
    const blob = await r.blob();
    if (r.ok) {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(blob);
      img.style.maxWidth = "150px";
      document.getElementById("log").appendChild(img);
    } else {
      const text = await blob.text();
      log("Error body: " + text);
    }
  } catch (e) {
    log("Fetch error: " + e.message);
  }
});