#!/bin/bash
# AssetForge Cloud - Quick Test Script (Linux/Mac)
# Run this to verify everything works before deploying

echo "🔨 AssetForge Cloud - Pre-Deployment Check"
echo "=========================================="
echo ""

# Check Node version
echo "1️⃣  Checking Node.js version..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "   ✅ Node.js $NODE_VERSION installed"
else
    echo "   ❌ Node.js not found! Please install Node.js 18+"
    exit 1
fi

# Check dependencies
echo ""
echo "2️⃣  Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "   ✅ node_modules found"
else
    echo "   ⚠️  Installing dependencies..."
    npm install
fi

# Create tmp directory
echo ""
echo "3️⃣  Checking tmp directory..."
if [ ! -d "tmp" ]; then
    mkdir -p tmp
    echo "   ✅ Created tmp directory"
else
    echo "   ✅ tmp directory exists"
fi

# Check important files
echo ""
echo "4️⃣  Verifying cloud files..."
FILES=(
    "src/ui/server-cloud.js"
    "src/ui/index-cloud.html"
    "Dockerfile"
    "render.yaml"
    "QUICKSTART.md"
)

ALL_GOOD=true
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file missing!"
        ALL_GOOD=false
    fi
done

if [ "$ALL_GOOD" = false ]; then
    echo ""
    echo "❌ Some files are missing. Please check your setup."
    exit 1
fi

# Start server
echo ""
echo "5️⃣  Starting cloud server..."
echo "   Server will start on http://localhost:5173"
echo "   Press Ctrl+C to stop"
echo ""

sleep 1

# Set environment variables for local testing
export NODE_ENV="development"
export PORT="5173"
export MAX_FILE_SIZE="50"
export RATE_LIMIT_MAX="100"
export RATE_LIMIT_WINDOW="15"
export UI_LOG="true"

echo "📊 Configuration:"
echo "   Port: 5173"
echo "   Max File Size: 50 MB"
echo "   Rate Limit: 100 requests per 15 minutes"
echo ""

echo "🚀 Starting server..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start the server
node src/ui/server-cloud.js
