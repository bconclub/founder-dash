#!/bin/bash
# ============================================================
# Sync Master Template → ALL Brands
# ============================================================
# Usage: ./scripts/sync-all-brands.sh [product]
# Example: ./scripts/sync-all-brands.sh dashboard
# Example: ./scripts/sync-all-brands.sh web-agent
#
# Pushes master template to every brand directory at once.
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

PRODUCT=$1

if [ -z "$PRODUCT" ]; then
  echo "Usage: ./scripts/sync-all-brands.sh [product]"
  echo "  product: dashboard, web-agent"
  exit 1
fi

if [ "$PRODUCT" != "dashboard" ] && [ "$PRODUCT" != "web-agent" ]; then
  echo "❌ Unknown product '$PRODUCT'. Supported: dashboard, web-agent"
  exit 1
fi

echo ""
echo "🔄 Syncing Master → All Brands ($PRODUCT)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

SYNCED=0
SKIPPED=0

for BRAND in proxe windchasers; do
  # Check if brand product directory exists
  if [ -d "brand/$BRAND/$PRODUCT/build" ] || [ -d "brand/$BRAND/$PRODUCT" ]; then
    echo "────────────────────────────────────────"
    echo "  Brand: $BRAND"
    echo "────────────────────────────────────────"
    "$SCRIPT_DIR/sync-master-to-brand.sh" "$BRAND" "$PRODUCT"
    SYNCED=$((SYNCED + 1))
    echo ""
  else
    echo "⏭️  Skipping $BRAND/$PRODUCT (directory not found)"
    SKIPPED=$((SKIPPED + 1))
    echo ""
  fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Done! Synced $SYNCED brand(s), skipped $SKIPPED"
echo ""
echo "📝 Next: test each brand build:"
for BRAND in proxe windchasers; do
  if [ -d "brand/$BRAND/$PRODUCT/build" ]; then
    echo "   cd brand/$BRAND/$PRODUCT/build && npm install && npm run dev"
  elif [ -d "brand/$BRAND/$PRODUCT" ]; then
    echo "   cd brand/$BRAND/$PRODUCT && npm install && npm run dev"
  fi
done
