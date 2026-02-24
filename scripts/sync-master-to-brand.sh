#!/bin/bash
# ============================================================
# Sync Master Template → Brand
# ============================================================
# Usage: ./scripts/sync-master-to-brand.sh [brand] [product]
# Example: ./scripts/sync-master-to-brand.sh windchasers dashboard
# Example: ./scripts/sync-master-to-brand.sh proxe web-agent
#
# Copies master source code into a brand directory.
# Brand-specific files (.env.local, brand configs, logos) are preserved.
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

BRAND=$1
PRODUCT=$2

if [ -z "$BRAND" ] || [ -z "$PRODUCT" ]; then
  echo "Usage: ./scripts/sync-master-to-brand.sh [brand] [product]"
  echo "  brand:   proxe, windchasers, etc."
  echo "  product: dashboard, web-agent"
  exit 1
fi

# Validate brand
if [ "$BRAND" != "proxe" ] && [ "$BRAND" != "windchasers" ]; then
  echo "❌ Unknown brand '$BRAND'. Supported: proxe, windchasers"
  exit 1
fi

# Validate product
if [ "$PRODUCT" != "dashboard" ] && [ "$PRODUCT" != "web-agent" ]; then
  echo "❌ Unknown product '$PRODUCT'. Supported: dashboard, web-agent"
  exit 1
fi

# Resolve paths — dashboard uses build/ subdirectory, web-agent may not
if [ "$PRODUCT" = "dashboard" ]; then
  MASTER_PATH="brand/master/$PRODUCT/build"
  BRAND_PATH="brand/$BRAND/$PRODUCT/build"
else
  # web-agent: proxe has no build/ subdir, windchasers does
  if [ -d "brand/master/$PRODUCT/build" ]; then
    MASTER_PATH="brand/master/$PRODUCT/build"
  else
    MASTER_PATH="brand/master/$PRODUCT"
  fi
  if [ -d "brand/$BRAND/$PRODUCT/build" ]; then
    BRAND_PATH="brand/$BRAND/$PRODUCT/build"
  else
    BRAND_PATH="brand/$BRAND/$PRODUCT"
  fi
fi

if [ ! -d "$MASTER_PATH" ]; then
  echo "❌ Master path not found: $MASTER_PATH"
  exit 1
fi

if [ ! -d "$BRAND_PATH" ]; then
  echo "❌ Brand path not found: $BRAND_PATH"
  echo "   Create it first or check the product name."
  exit 1
fi

echo ""
echo "🔄 Syncing Master → $BRAND ($PRODUCT)"
echo "   From: $MASTER_PATH/"
echo "   To:   $BRAND_PATH/"
echo ""

# ── Backup ──
BACKUP_DIR="${BRAND_PATH}/.sync-backup-$(date +%Y%m%d-%H%M%S)"
echo "📦 Creating backup at $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"
if [ -d "${BRAND_PATH}/src" ]; then
  cp -r "${BRAND_PATH}/src" "$BACKUP_DIR/src" 2>/dev/null || true
fi
if [ -f "${BRAND_PATH}/package.json" ]; then
  cp "${BRAND_PATH}/package.json" "$BACKUP_DIR/" 2>/dev/null || true
fi
echo ""

# ── Sync src/ ──
echo "📂 Syncing src/ ..."
rsync -av --delete \
  --exclude='.env.local' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='package-lock.json' \
  --exclude='.sync-backup-*' \
  --exclude='*.log' \
  "$MASTER_PATH/src/" "$BRAND_PATH/src/"

echo ""

# ── Sync public/ (preserve brand assets) ──
if [ -d "$MASTER_PATH/public" ]; then
  echo "📂 Syncing public/ (preserving brand logos/icons) ..."
  rsync -av \
    --exclude='logo.svg' \
    --exclude='logo.png' \
    --exclude='icon.svg' \
    --exclude='icon.png' \
    --exclude='favicon.ico' \
    --exclude='*.png' \
    "$MASTER_PATH/public/" "$BRAND_PATH/public/"
  echo ""
fi

# ── Sync config files (non-destructive) ──
echo "📂 Syncing config files ..."
for CONFIG_FILE in next.config.js tailwind.config.ts tsconfig.json postcss.config.js postcss.config.mjs; do
  if [ -f "$MASTER_PATH/$CONFIG_FILE" ]; then
    cp "$MASTER_PATH/$CONFIG_FILE" "$BRAND_PATH/$CONFIG_FILE"
    echo "   ✓ $CONFIG_FILE"
  fi
done
echo ""

# ── Summary ──
echo "✅ Synced Master → $BRAND ($PRODUCT)"
echo ""
echo "⚠️  NOT synced (brand-specific):"
echo "   • .env.local"
echo "   • package.json (sync dependencies manually if needed)"
echo "   • Brand logos/icons in public/"
echo "   • supabase/migrations/"
echo ""
echo "📝 Next steps:"
echo "   1. cd $BRAND_PATH"
echo "   2. Check diff: git diff $BRAND_PATH/"
echo "   3. npm install  (if deps changed)"
echo "   4. npm run dev  (test it)"
echo "   5. If broken, restore: cp -r $BACKUP_DIR/* $BRAND_PATH/"
