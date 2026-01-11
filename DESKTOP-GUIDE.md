# AssetForge Desktop - Quick Start Guide

## 🚀 Installation

### Step 1: Install Dependencies

```bash
npm install
```

This will install:

- Electron (desktop framework)
- electron-builder (for creating installers)
- All existing dependencies (Sharp, etc.)

### Step 2: Run in Development

```bash
npm run electron:dev
```

The app will open. You can now:

- Click to select images or drag & drop
- Configure optimization settings
- Process images locally (no server needed!)
- Save optimized images

### Step 3: Build Installers

#### For Windows:

```bash
npm run build:win
```

Output: `dist/AssetForge Setup 1.0.0.exe` (~120MB)

#### For Linux:

```bash
npm run build:linux
```

Output:

- `dist/AssetForge-1.0.0.AppImage` (~130MB)
- `dist/assetforge_1.0.0_amd64.deb` (~130MB)

#### For Both:

```bash
npm run build:all
```

---

## 📦 What Gets Built

### Windows Installer

- **File**: `AssetForge Setup 1.0.0.exe`
- **Size**: ~120MB (includes Node.js runtime)
- **Install Location**: `C:\Users\<user>\AppData\Local\Programs\AssetForge`
- **Shortcuts**: Desktop + Start Menu

### Linux AppImage

- **File**: `AssetForge-1.0.0.AppImage`
- **Size**: ~130MB
- **Usage**: `chmod +x AssetForge-1.0.0.AppImage && ./AssetForge-1.0.0.AppImage`
- **No installation needed!**

### Linux .deb Package

- **File**: `assetforge_1.0.0_amd64.deb`
- **Install**: `sudo dpkg -i assetforge_1.0.0_amd64.deb`
- **Uninstall**: `sudo apt remove assetforge`

---

## 🎯 Distribution

### Option 1: GitHub Releases (Recommended - FREE)

1. Create a GitHub release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

2. Go to GitHub → Releases → Create Release
3. Upload these files:
   - `AssetForge-Setup-1.0.0.exe`
   - `AssetForge-1.0.0.AppImage`
   - `assetforge_1.0.0_amd64.deb`

Users can download directly from GitHub!

### Option 2: Your Website

Upload installers to your website:

```
https://yourwebsite.com/download/AssetForge-Setup-1.0.0.exe
```

### Option 3: Microsoft Store (Optional - $19 fee)

For wider reach, publish to Microsoft Store later.

---

## 💰 Monetization Options

### Option A: Completely Free

- No license key system
- Just "Buy Me a Coffee" link in the app
- Builds goodwill and user base

### Option B: Freemium (Recommended)

- Basic features free
- Pro features ($5) unlocked with license key
- I can add this system if you want

### Option C: Paid Only

- $5 upfront
- License key required
- Use Gumroad or LemonSqueezy for payments

**My recommendation**: Start with **Option A** (free + donations) to build users, then add Option B later.

---

## 🔧 Customization

### Change App Icon

Replace these files:

- `electron/icon.ico` (Windows - 256x256)
- `electron/icon.png` (Linux - 512x512)

Use tools like:

- [ICO Converter](https://icoconvert.com/) for .ico
- Any image editor for .png

### Change App Name/Version

Edit `package.json`:

```json
{
	"name": "assetforge",
	"version": "1.0.0",
	"productName": "AssetForge"
}
```

### Add License Key System

Let me know and I'll add:

- License key validation
- Pro features unlock
- Gumroad integration

---

## 📈 Next Steps

1. **Test the app**: `npm run electron:dev`
2. **Build installers**: `npm run build:all`
3. **Test installers**: Install on a clean machine
4. **Create website**: Landing page with download buttons
5. **Launch**: Post on Reddit, ProductHunt, HackerNews
6. **Iterate**: Get feedback and improve

---

## 🐛 Troubleshooting

### Build fails on Windows

```bash
npm install --save-dev electron-builder --legacy-peer-deps
```

### Build fails on Linux

```bash
sudo apt-get install -y rpm
```

### App doesn't start

Check `electron/main.js` - ensure paths are correct.

### Images not processing

Open DevTools: Menu → View → Toggle Developer Tools

---

## 🎉 You're Ready!

Run this now:

```bash
npm install
npm run electron:dev
```

The app will open. Test it, then build installers when ready!

**Questions?** Let me know and I'll help debug! 🚀
