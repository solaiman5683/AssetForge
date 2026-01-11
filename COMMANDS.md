# 🎯 AssetForge Cloud - Command Reference

## 📦 Installation

```bash
# Install dependencies
npm install

# Verify installation
node --version  # Should be 18+
```

---

## 🚀 Running Locally

### Development Mode

```bash
# Original local server (no rate limits)
npm run ui

# Cloud server (with rate limits)
npm run cloud

# Using test script (recommended)
.\test-cloud.ps1          # Windows
./test-cloud.sh           # Mac/Linux
```

**URL:** http://localhost:5173

---

## 🐳 Docker

### Build & Run

```bash
# Build image
npm run docker:build
# OR
docker build -t assetforge .

# Run with docker-compose
npm run docker:run
# OR
docker-compose up

# Run standalone
docker run -p 5173:5173 assetforge
```

### Stop

```bash
# Stop docker-compose
docker-compose down

# Stop container
docker stop <container-id>
```

---

## ☁️ Deployment

### Render.com (Recommended)

```bash
# 1. Push to GitHub
git add .
git commit -m "Deploy to Render"
git push origin main

# 2. Go to render.com
# 3. Connect repo
# 4. Auto-deploys from render.yaml
```

**Manual configuration:**

- Build Command: `npm install`
- Start Command: `node src/ui/server-cloud.js`
- Environment: Node

### Railway.app

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up

# Or use web interface
# railway.app → New Project → Deploy from GitHub
```

### Fly.io

```bash
# Install Fly CLI (Windows)
iwr https://fly.io/install.ps1 -useb | iex

# Login
flyctl auth login

# Launch (first time)
flyctl launch

# Deploy
flyctl deploy

# Check status
flyctl status

# View logs
flyctl logs
```

### Google Cloud Run

```bash
# Install gcloud CLI first

# Build
gcloud builds submit --tag gcr.io/PROJECT_ID/assetforge

# Deploy
gcloud run deploy assetforge \
  --image gcr.io/PROJECT_ID/assetforge \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Create .env file
cp .env.example .env

# Edit values
# PORT=5173
# MAX_FILE_SIZE=50
# RATE_LIMIT_MAX=50
# RATE_LIMIT_WINDOW=15
```

### Set in Render

```bash
# Via Dashboard:
# Environment → Add Environment Variable

# Key-Value pairs:
NODE_ENV=production
PORT=5173
MAX_FILE_SIZE=50
RATE_LIMIT_MAX=50
RATE_LIMIT_WINDOW=15
```

---

## 📊 Monitoring

### Health Check

```bash
# Local
curl http://localhost:5173/health

# Production
curl https://your-app.onrender.com/health
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2026-01-10T12:00:00.000Z",
  "uptime": 3600,
  "memory": {...}
}
```

### Stats

```bash
# Check stats
curl http://localhost:5173/stats
```

### Logs

```bash
# Render: View in dashboard

# Railway:
railway logs

# Fly.io:
flyctl logs

# Docker:
docker logs <container-id>
```

---

## 🧪 Testing

### Manual Testing

```bash
# Start server
npm run cloud

# Test image optimization
curl -X POST http://localhost:5173/api/image \
  -F "file=@test.jpg" \
  -F "width=800" \
  -F "quality=80" \
  --output optimized.jpg

# Test health
curl http://localhost:5173/health

# Test rate limiting (run 51 times)
for ($i=0; $i -lt 51; $i++) {
  curl http://localhost:5173/health
}
```

### Run Tests

```bash
# Run unit tests
npm test

# Run specific test
npm test image.test.js
```

---

## 🔄 Updates & Maintenance

### Update Dependencies

```bash
# Check for updates
npm outdated

# Update all
npm update

# Update specific package
npm install sharp@latest
```

### Update Production

```bash
# Commit changes
git add .
git commit -m "Update dependencies"
git push origin main

# Auto-deploys on:
# - Render (if auto-deploy enabled)
# - Railway (always)

# Manual deploy:
# - Render: Click "Manual Deploy"
# - Fly.io: flyctl deploy
```

### Rollback

```bash
# Render: Use dashboard to rollback to previous deploy

# Fly.io:
flyctl releases list
flyctl releases rollback <version>

# Railway:
# Use dashboard to redeploy previous version
```

---

## 🗑️ Cleanup

### Clear Temp Files

```bash
# Manual cleanup
rm -rf tmp/*        # Mac/Linux
Remove-Item tmp\* -Force  # Windows

# Automatic cleanup runs every 30 minutes
```

### Remove Docker

```bash
# Remove container
docker rm <container-id>

# Remove image
docker rmi assetforge

# Remove all unused
docker system prune -a
```

### Uninstall

```bash
# Remove dependencies
rm -rf node_modules
rm package-lock.json

# Remove deployment
# Render: Delete service in dashboard
# Fly.io: flyctl apps destroy assetforge
```

---

## 🐛 Debugging

### Check Logs

```bash
# Local (verbose)
UI_LOG=true npm run cloud

# Production logs
# See platform-specific commands above
```

### Common Issues

**Port already in use:**

```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <pid> /F

# Mac/Linux
lsof -ti:5173 | xargs kill -9
```

**Memory issues:**

```bash
# Increase memory limit
$env:NODE_OPTIONS="--max-old-space-size=1024"
npm run cloud
```

**Sharp installation issues:**

```bash
# Rebuild Sharp
npm rebuild sharp

# Clean install
rm -rf node_modules
npm install
```

---

## 📦 Package Scripts

```json
{
	"start": "node src/cli.js", // CLI mode
	"ui": "node src/ui/server.js", // Local UI (no limits)
	"cloud": "node src/ui/server-cloud.js", // Cloud UI (with limits)
	"test": "jest", // Run tests
	"docker:build": "docker build -t assetforge .",
	"docker:run": "docker-compose up"
}
```

---

## 🔑 API Usage

### Image Optimization

```bash
curl -X POST https://your-app.com/api/image \
  -F "file=@image.jpg" \
  -F "width=800" \
  -F "quality=80" \
  -F "format=webp" \
  -F "watermark=© 2026" \
  -F "wm_position=southeast" \
  -F "wm_opacity=0.5" \
  --output result.webp
```

### SVG Optimization

```bash
curl -X POST https://your-app.com/api/svg \
  -F "file=@logo.svg" \
  --output optimized.svg
```

### JSON Minification

```bash
curl -X POST https://your-app.com/api/json \
  -F "file=@data.json" \
  --output minified.json
```

### Check Rate Limits

```bash
curl -I https://your-app.com/api/image

# Headers:
# X-RateLimit-Limit: 50
# X-RateLimit-Remaining: 49
```

---

## 🎨 Customization Commands

### Update Ko-fi Link

```bash
# Find and replace in index-cloud.html
# Windows PowerShell:
(Get-Content src/ui/index-cloud.html) -replace 'yourusername', 'YOUR_ACTUAL_USERNAME' | Set-Content src/ui/index-cloud.html

# Mac/Linux:
sed -i 's/yourusername/YOUR_ACTUAL_USERNAME/g' src/ui/index-cloud.html
```

### Change Branding

```bash
# Edit index-cloud.html
code src/ui/index-cloud.html  # VS Code
nano src/ui/index-cloud.html  # Terminal
notepad src/ui/index-cloud.html  # Windows
```

---

## 🚨 Emergency Commands

### Kill All Node Processes

```bash
# Windows
taskkill /F /IM node.exe

# Mac/Linux
pkill -9 node
```

### Force Clean

```bash
# Remove everything and reinstall
rm -rf node_modules tmp
npm cache clean --force
npm install
```

### Reset Git

```bash
# Discard all changes
git reset --hard HEAD
git clean -fd
```

---

## 📱 Quick Commands Reference

```bash
# Local dev
npm run cloud

# Deploy (after git push)
# Auto-deploys on Render/Railway

# Check health
curl https://your-app.com/health

# View logs
# See platform logs in dashboard

# Update production
git push origin main

# Emergency stop
# Use platform dashboard
```

---

## 💡 Pro Tips

### Keep Server Awake (Render)

```bash
# Use UptimeRobot to ping every 5 min
# Add monitor: https://your-app.onrender.com/health
# Free tier: 50 monitors
```

### Monitor Performance

```bash
# Install pm2 for production monitoring
npm install -g pm2

# Start with pm2
pm2 start src/ui/server-cloud.js --name assetforge

# Monitor
pm2 monit

# Logs
pm2 logs assetforge
```

### Backup Configuration

```bash
# Export environment variables
# Render: Settings → Download as JSON

# Save to file
echo "PORT=5173" > .env.backup
echo "MAX_FILE_SIZE=50" >> .env.backup
```

---

## 📚 More Info

- Full docs: See all `.md` files in root
- Issues: GitHub Issues
- Discussions: GitHub Discussions

---

**Last Updated:** 2026-01-10
**Version:** 2.0.0-cloud
