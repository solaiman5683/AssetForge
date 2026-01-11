# AssetForge Cloud - Quick Test Script
# Run this to verify everything works before deploying

Write-Host "🔨 AssetForge Cloud - Pre-Deployment Check" -ForegroundColor Cyan
Write-Host "==========================================`n" -ForegroundColor Cyan

# Check Node version
Write-Host "1️⃣  Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($nodeVersion) {
    Write-Host "   ✅ Node.js $nodeVersion installed" -ForegroundColor Green
} else {
    Write-Host "   ❌ Node.js not found! Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Check dependencies
Write-Host "`n2️⃣  Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "   ✅ node_modules found" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Create tmp directory
Write-Host "`n3️⃣  Checking tmp directory..." -ForegroundColor Yellow
if (!(Test-Path "tmp")) {
    New-Item -ItemType Directory -Path "tmp" | Out-Null
    Write-Host "   ✅ Created tmp directory" -ForegroundColor Green
} else {
    Write-Host "   ✅ tmp directory exists" -ForegroundColor Green
}

# Check important files
Write-Host "`n4️⃣  Verifying cloud files..." -ForegroundColor Yellow
$files = @(
    "src/ui/server-cloud.js",
    "src/ui/index-cloud.html",
    "Dockerfile",
    "render.yaml",
    "QUICKSTART.md"
)

$allGood = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file missing!" -ForegroundColor Red
        $allGood = $false
    }
}

if (!$allGood) {
    Write-Host "`n❌ Some files are missing. Please check your setup." -ForegroundColor Red
    exit 1
}

# Start server
Write-Host "`n5️⃣  Starting cloud server..." -ForegroundColor Yellow
Write-Host "   Server will start on http://localhost:5173" -ForegroundColor Cyan
Write-Host "   Press Ctrl+C to stop`n" -ForegroundColor Cyan

Start-Sleep -Seconds 1

# Set environment variables for local testing
$env:NODE_ENV = "development"
$env:PORT = "5173"
$env:MAX_FILE_SIZE = "50"
$env:RATE_LIMIT_MAX = "100"
$env:RATE_LIMIT_WINDOW = "15"
$env:UI_LOG = "true"

Write-Host "📊 Configuration:" -ForegroundColor Magenta
Write-Host "   Port: 5173" -ForegroundColor Gray
Write-Host "   Max File Size: 50 MB" -ForegroundColor Gray
Write-Host "   Rate Limit: 100 requests per 15 minutes`n" -ForegroundColor Gray

Write-Host "🚀 Starting server..." -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Start the server
node src/ui/server-cloud.js
