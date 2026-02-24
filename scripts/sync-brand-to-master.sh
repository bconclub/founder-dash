#!/bin/bash
# ============================================================
# Sync Brand → Master Template
# ============================================================
# Usage: ./scripts/sync-brand-to-master.sh [brand] [product]
# Example: ./scripts/sync-brand-to-master.sh proxe dashboard
# Example: ./scripts/sync-brand-to-master.sh windchasers web-agent
#
# Copies brand code BACK to master (use when you built in brand first).
# This overwrites master with brand code — review diff before committing.
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

BRAND=$1
PRODUCT=$2

if [ -z "$BRAND" ] || [ -z "$PRODUCT" ]; then
  echo "Usage: ./scripts/sync-brand-to-master.sh [brand] [product]"
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

# Resolve paths
if [ "$PRODUCT" = "dashboard" ]; then
  MASTER_PATH="brand/master/$PRODUCT/build"
  BRAND_PATH="brand/$BRAND/$PRODUCT/build"
else
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

if [ ! -d "$BRAND_PATH" ]; then
  echo "❌ Brand path not found: $BRAND_PATH"
  exit 1
fi

if [ ! -d "$MASTER_PATH" ]; then
  echo "⚠️  Master path not found: $MASTER_PATH"
  echo "   Creating directory..."
  mkdir -p "$MASTER_PATH"
fi

echo ""
echo "🔄 Syncing $BRAND → Master ($PRODUCT)"
echo "   From: $BRAND_PATH/"
echo "   To:   $MASTER_PATH/"
echo ""
echo "⚠️  This will OVERWRITE Master with $BRAND code."
read -p "   Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Cancelled."
  exit 0
fi

echo ""

# ── Backup master ──
BACKUP_DIR="${MASTER_PATH}/.sync-backup-$(date +%Y%m%d-%H%M%S)"
echo "📦 Creating master backup at $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"
if [ -d "${MASTER_PATH}/src" ]; then
  cp -r "${MASTER_PATH}/src" "$BACKUP_DIR/src" 2>/dev/null || true
fi
if [ -f "${MASTER_PATH}/package.json" ]; then
  cp "${MASTER_PATH}/package.json" "$BACKUP_DIR/" 2>/dev/null || true
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
  "$BRAND_PATH/src/" "$MASTER_PATH/src/"

echo ""

# ── Sync public/ ──
if [ -d "$BRAND_PATH/public" ]; then
  echo "📂 Syncing public/ ..."
  rsync -av \
    "$BRAND_PATH/public/" "$MASTER_PATH/public/"
  echo ""
fi

# ── Sync config files ──
echo "📂 Syncing config files ..."
for CONFIG_FILE in next.config.js tailwind.config.ts tsconfig.json postcss.config.js postcss.config.mjs middleware.ts; do
  if [ -f "$BRAND_PATH/$CONFIG_FILE" ]; then
    cp "$BRAND_PATH/$CONFIG_FILE" "$MASTER_PATH/$CONFIG_FILE"
    echo "   ✓ $CONFIG_FILE"
  fi
done
echo ""

# ── Sync package.json ──
if [ -f "$BRAND_PATH/package.json" ]; then
  cp "$BRAND_PATH/package.json" "$MASTER_PATH/package.json"
  echo "   ✓ package.json"
fi
echo ""

# ── Summary ──
echo "✅ Synced $BRAND → Master ($PRODUCT)"
echo ""
echo "⚠️  IMPORTANT — Make the synced code brand-agnostic:"
echo "   • Replace hardcoded brand names ('proxe', 'windchasers') with config references"
echo "   • Replace brand-specific URLs with environment variables"
echo "   • Check for brand-specific logic and extract to config"
echo "   • Review: git diff $MASTER_PATH/"
echo ""
echo "📝 Next steps:"
echo "   1. Review diff: git diff $MASTER_PATH/"
echo "   2. Remove brand-specific hardcoding"
echo "   3. Test master build: cd $MASTER_PATH && npm install && npm run build"
echo "   4. If broken, restore: cp -r $BACKUP_DIR/* $MASTER_PATH/"
