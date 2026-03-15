#!/bin/bash
# ============================================================
# update-deploy.sh - Update deployment on EC2
# Usage: chmod +x update-deploy.sh && ./update-deploy.sh
# Run this after pushing new code or copying files to server
# ============================================================

set -e

echo "🔄 Updating deployment - 日本語マスター"
echo "========================================="

# --- Configuration ---
APP_NAME="nihongo-master"
APP_DIR="/home/ubuntu/$APP_NAME"

# --- Load nvm if needed ---
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd "$APP_DIR"

# --- Backup database before update ---
echo "💾 Step 1: Backup database"
BACKUP_DIR="data/backup"
mkdir -p "$BACKUP_DIR"
if [ -f "data/database/nihongo.db" ]; then
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    cp data/database/nihongo.db "$BACKUP_DIR/nihongo_${TIMESTAMP}.db"
    echo "  Backed up to $BACKUP_DIR/nihongo_${TIMESTAMP}.db"
    
    # Keep only last 10 backups
    ls -t "$BACKUP_DIR"/nihongo_*.db 2>/dev/null | tail -n +11 | xargs -r rm
    echo "  Cleaned old backups (keeping last 10)"
else
    echo "  No database to backup"
fi

# --- Pull latest code (if using git) ---
echo "📥 Step 2: Pull latest code"
if [ -d ".git" ]; then
    git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || echo "  Git pull skipped"
else
    echo "  Not a git repo - assuming files were copied manually"
fi

# --- Install dependencies ---
echo "📦 Step 3: Install dependencies"
npm install

# --- Build ---
echo "🔨 Step 4: Build project"
npm run build

# --- Restart PM2 ---
echo "🔄 Step 5: Restart app"
pm2 restart "$APP_NAME"

# --- Verify ---
echo "✅ Step 6: Verify"
sleep 3
pm2 status "$APP_NAME"

echo ""
echo "✅ Update complete!"
echo "========================================="
echo "📋 Check logs: pm2 logs $APP_NAME --lines 50"
echo "========================================="
