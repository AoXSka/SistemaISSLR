#!/bin/bash
# ContaVe Pro - Docker Build Script for CI/CD

set -e

echo "🐳 ContaVe Pro - Docker Build Script"
echo "=================================="

# Configuration
DOCKER_IMAGE="contave-pro-builder"
OUTPUT_DIR="./release"
PROJECT_NAME="contave-pro"

# Cleanup previous builds
echo "🧹 Cleaning previous builds..."
rm -rf release/* dist/*
mkdir -p release

# Build Docker image
echo "🔨 Building Docker image..."
docker build -t ${DOCKER_IMAGE} .

# Verify image was created
if ! docker images ${DOCKER_IMAGE} --format "table {{.Repository}}" | grep -q ${DOCKER_IMAGE}; then
    echo "❌ ERROR: Docker image was not created"
    exit 1
fi

echo "✅ Docker image created successfully"

# Run build in container
echo "🚀 Running build in container..."
docker run --rm \
    -v "$(pwd)/release:/output" \
    -v "$(pwd)/node_modules:/app/node_modules" \
    -e NODE_ENV=production \
    ${DOCKER_IMAGE}

# Verify build outputs
echo "🔍 Verifying build outputs..."
if ls release/*.exe 1> /dev/null 2>&1; then
    echo "✅ Windows executable generated:"
    ls -la release/*.exe
elif ls release/win-unpacked 1> /dev/null 2>&1; then
    echo "✅ Windows binaries generated:"
    ls -la release/win-unpacked/
else
    echo "❌ ERROR: No build outputs found"
    exit 1
fi

# Optional: Generate installer with Inno Setup
if command -v iscc &> /dev/null; then
    echo "📦 Generating installer with Inno Setup..."
    iscc installer.iss
    
    if [ -f "release/ContaVe-Pro-Setup-2.0.0.exe" ]; then
        echo "✅ Installer generated: ContaVe-Pro-Setup-2.0.0.exe"
        ls -la release/ContaVe-Pro-Setup-2.0.0.exe
    fi
else
    echo "ℹ️ Inno Setup not available, skipping installer generation"
fi

echo ""
echo "🎉 Docker build completed successfully!"
echo ""
echo "📁 Output files:"
ls -la release/

echo ""
echo "🎯 Next steps:"
echo "1. Test the generated executable on a clean Windows machine"
echo "2. Verify all features work correctly"
echo "3. Check database initialization"
echo "4. Validate uninstall process"