#!/bin/bash
# ============================================================
# first-deploy.sh - First-time deployment to EC2
# Usage: chmod +x first-deploy.sh && ./first-deploy.sh
# ============================================================

set -e

echo "🚀 First-time deployment - 日本語マスター"
echo "========================================="

# --- Configuration ---
APP_NAME="nihongo-master"
APP_DIR="/home/ubuntu/$APP_NAME"
PORT=3456
NODE_VERSION="20"

# --- Check if running as appropriate user ---
if [ "$(whoami)" = "root" ]; then
    echo "⚠️  Running as root. Will set up for 'ubuntu' user."
    DEPLOY_USER="ubuntu"
else
    DEPLOY_USER=$(whoami)
fi

echo "📦 Step 1: System update & dependencies"
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y curl git build-essential

# --- Install Node.js via nvm ---
echo "📦 Step 2: Install Node.js $NODE_VERSION"
if ! command -v node &> /dev/null; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install $NODE_VERSION
    nvm use $NODE_VERSION
    nvm alias default $NODE_VERSION
else
    echo "  Node.js already installed: $(node --version)"
fi

# --- Install PM2 globally ---
echo "📦 Step 3: Install PM2"
npm install -g pm2

# --- Clone or copy project ---
echo "📁 Step 4: Set up project directory"
if [ ! -d "$APP_DIR" ]; then
    echo "  Creating $APP_DIR"
    mkdir -p "$APP_DIR"
    echo "  ℹ️  Please copy your project files to $APP_DIR"
    echo "  Example: scp -r ./* ubuntu@your-ec2-ip:$APP_DIR/"
    echo "  Or: git clone your-repo $APP_DIR"
fi

cd "$APP_DIR"

# --- Create .env.local if not exists ---
echo "🔑 Step 5: Environment configuration"
if [ ! -f ".env.local" ]; then
    JWT_SECRET=$(openssl rand -hex 32)
    cat > .env.local << EOF
JWT_SECRET=$JWT_SECRET
DATABASE_PATH=./data/database/nihongo.db
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin2026
HOSTNAME=0.0.0.0
PORT=$PORT
EOF
    echo "  Created .env.local with generated JWT_SECRET"
    echo "  ⚠️  Please update ADMIN_PASSWORD in .env.local!"
else
    echo "  .env.local already exists"
fi

# --- Create necessary directories ---
echo "📂 Step 6: Create data directories"
mkdir -p data/database
mkdir -p data/backup
mkdir -p data/imported

# --- Install dependencies ---
echo "📦 Step 7: Install npm dependencies"
npm install

# --- Build the project ---
echo "🔨 Step 8: Build Next.js project"
npm run build

# --- Seed the database ---
echo "🌱 Step 9: Seed database"
npx tsx scripts/seed.ts

# --- Start with PM2 ---
echo "🚀 Step 10: Start with PM2"
pm2 delete $APP_NAME 2>/dev/null || true
pm2 start npm --name "$APP_NAME" -- start
pm2 save

# --- Setup PM2 startup ---
echo "⚡ Step 11: Configure PM2 startup on reboot"
pm2 startup systemd -u $DEPLOY_USER --hp /home/$DEPLOY_USER
pm2 save

# --- Setup UFW firewall ---
echo "🔒 Step 12: Configure firewall"
sudo ufw allow 22/tcp
sudo ufw allow $PORT/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
echo "y" | sudo ufw enable || true

echo ""
echo "✅ Deployment complete!"
echo "========================================="
echo "🌐 App running at: http://$(curl -s ifconfig.me):$PORT"
echo "👤 Admin login: admin / admin2026"
echo "⚠️  Remember to change admin password!"
echo ""
echo "📋 Useful commands:"
echo "  pm2 status          - Check app status"
echo "  pm2 logs $APP_NAME  - View logs"
echo "  pm2 restart $APP_NAME - Restart app"
echo "  pm2 monit           - Monitor dashboard"
echo "========================================="
