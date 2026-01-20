#!/bin/bash
# Manual rebuild script for VPS
# Run this on the VPS to force a clean rebuild

set -e

echo "🔄 Starting manual rebuild on VPS..."

cd /var/www/windchasers-proxe

# Stop the app
echo "⏹️  Stopping application..."
pm2 stop windchasers-dashboard || pm2 stop ecosystem.config.js --only windchasers-dashboard || echo "App not running"

# Clean everything
echo "🧹 Cleaning build artifacts..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .next/cache 2>/dev/null || true

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build
echo "🏗️  Building application..."
echo "This may take several minutes..."
npm run build 2>&1 | tee build.log || {
  echo "❌ Build command failed!"
  echo "Last 50 lines of build output:"
  tail -50 build.log || true
  exit 1
}

# Verify build
if [ ! -d ".next" ]; then
  echo "❌ ERROR: Build failed - .next directory not found!"
  exit 1
fi

# Check BUILD_ID (critical)
if [ ! -f ".next/BUILD_ID" ]; then
  echo "❌ ERROR: BUILD_ID file not found - build is incomplete!"
  exit 1
fi
echo "✅ BUILD_ID found: $(cat .next/BUILD_ID)"

# Check chunks
CHUNK_COUNT=$(find .next/static/chunks -name "*.js" 2>/dev/null | wc -l)
if [ "$CHUNK_COUNT" -lt 30 ]; then
  echo "⚠️  WARNING: Only $CHUNK_COUNT chunks found (expected 30+)"
  # Don't fail if BUILD_ID and manifest exist - might be valid
  if [ -f ".next/BUILD_ID" ] && ([ -f ".next/BUILD_MANIFEST" ] || [ -f ".next/build-manifest.json" ]); then
    echo "✅ BUILD_ID and manifest exist - build may be valid"
  else
    echo "❌ ERROR: Build appears incomplete - missing BUILD_ID or manifest"
    tail -50 build.log || true
    exit 1
  fi
else
  echo "✅ Found $CHUNK_COUNT chunk files"
fi

# Check CSS files
if [ -d ".next/static/css" ]; then
  CSS_COUNT=$(find .next/static/css -name "*.css" 2>/dev/null | wc -l)
  echo "✅ Found $CSS_COUNT CSS files"
  if [ "$CSS_COUNT" -eq 0 ]; then
    echo "⚠️  WARNING: No CSS files found - styling may be broken"
  fi
fi

# Force stop and delete old process
echo "🔄 Stopping old process..."
pm2 stop windchasers-dashboard 2>/dev/null || true
pm2 delete windchasers-dashboard 2>/dev/null || true
pm2 stop ecosystem.config.js --only windchasers-dashboard 2>/dev/null || true
sleep 2

# Restart
echo "🔄 Starting application..."
if [ -f ecosystem.config.js ]; then
  pm2 start ecosystem.config.js --only windchasers-dashboard || {
    echo "⚠️  Failed to start with ecosystem, trying fallback..."
    PORT=3003 pm2 start npm --name windchasers-dashboard -- start
  }
else
  PORT=3003 pm2 start npm --name windchasers-dashboard -- start
fi

pm2 save

# Wait for app to start
echo "⏳ Waiting for app to start..."
sleep 5

# Verify it's running
echo "📊 PM2 status:"
pm2 list | grep windchasers
pm2 describe windchasers-dashboard | head -15 || true

# Test health endpoint
echo "🏥 Testing health endpoint..."
sleep 3
curl -f http://localhost:3003/api/health && echo "" || echo "⚠️  Health endpoint not responding yet"

echo "✅ Rebuild complete!"
echo "📊 PM2 status:"
pm2 list | grep windchasers
