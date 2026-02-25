#!/bin/bash
# ============================================================
# Sync Brand → Master
# ============================================================
# Usage: ./scripts/sync-brand-to-master.sh [brand]
# Example: ./scripts/sync-brand-to-master.sh windchasers
#
# Copies brand agent code BACK to master (use when you built in brand first).
# This overwrites master with brand code — review diff before committing.
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

BRAND=$1

if [ -z "$BRAND" ]; then
  echo "Usage: ./scripts/sync-brand-to-master.sh [brand]"
  echo "  brand: proxe, windchasers"
  exit 1
fi

# Validate brand
if [ "$BRAND" != "proxe" ] && [ "$BRAND" != "windchasers" ]; then
  echo "❌ Unknown brand '$BRAND'. Supported: proxe, windchasers"
  exit 1
fi

MASTER_PATH="master/agent"
BRAND_PATH="$BRAND/agent"

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
echo "🔄 Syncing $BRAND → Master"
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
for CONFIG_FILE in next.config.js tailwind.config.ts tsconfig.json postcss.config.js postcss.config.mjs middleware.ts package.json; do
  if [ -f "$BRAND_PATH/$CONFIG_FILE" ]; then
    cp "$BRAND_PATH/$CONFIG_FILE" "$MASTER_PATH/$CONFIG_FILE"
    echo "   ✓ $CONFIG_FILE"
  fi
done
echo ""

# ── Summary ──
echo "✅ Synced $BRAND → Master"
echo ""
echo "📝 Next steps:"
echo "   1. Review diff: git diff master/"
echo "   2. Test master build: cd master/agent && npm install && npm run build"
echo "   3. Sync to other brands: ./scripts/sync-all-brands.sh"
