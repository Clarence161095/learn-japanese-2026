#!/bin/bash
# ============================================================
# first-deploy.sh - First-time deployment to EC2 (Amazon Linux)
# Usage: chmod +x first-deploy.sh && ./first-deploy.sh
# ============================================================

set -e

echo "🚀 First-time deployment - 日本語マスター"
echo "========================================="

# --- Configuration ---
APP_NAME="nihongo-master"
PORT=3000
NODE_VERSION="20"

# Dùng luôn thư mục chứa project (cha của thư mục scripts/)
APP_DIR=$(dirname $(pwd))
DEPLOY_USER=$(whoami)

echo "📦 Step 1: System update & dependencies"
sudo yum update -y
sudo yum install -y curl git gcc-c++ make openssl-devel --allowerasing

# --- Install Node.js via nvm ---
echo "📦 Step 2: Install Node.js $NODE_VERSION"
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm install $NODE_VERSION
nvm use $NODE_VERSION
nvm alias default $NODE_VERSION

# --- Install PM2 globally ---
echo "📦 Step 3: Install PM2"
npm install -g pm2

# --- Set up project directory ---
echo "📁 Step 4: Setting working directory to $APP_DIR"
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
EOF
    echo "  Created .env.local with generated JWT_SECRET"
fi

# --- Create necessary directories ---
echo "📂 Step 6: Create data directories"
mkdir -p data/database data/backup data/imported

# --- Install dependencies ---
echo "📦 Step 7: Install npm dependencies"
rm -rf node_modules package-lock.json
npm install

# --- Build the project ---
echo "🔨 Step 8: Build Next.js project"
npm run build

# --- Seed the database ---
echo "🌱 Step 9: Seed database"
npx tsx scripts/seed.ts

# --- Start with PM2 enforcing 0.0.0.0 ---
echo "🚀 Step 10: Start with PM2 (Binding to 0.0.0.0)"
# Tạo file ecosystem để config rõ ràng biến môi trường cho PM2
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: "$APP_NAME",
      script: "npm",
      args: "start",
      env: {
        PORT: $PORT,
        HOSTNAME: "0.0.0.0"
      }
    }
  ]
}
EOF

pm2 delete $APP_NAME 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# --- Setup PM2 startup ---
echo "⚡ Step 11: Configure PM2 startup on reboot"
# Gỡ cấu hình cũ (nếu có) và cài đặt cấu hình mới với đúng đường dẫn NVM
sudo env PATH=$PATH:$(dirname $(which node)) $(which pm2) unstartup systemd -u $DEPLOY_USER --hp /home/$DEPLOY_USER 2>/dev/null || true
sudo env PATH=$PATH:$(dirname $(which node)) $(which pm2) startup systemd -u $DEPLOY_USER --hp /home/$DEPLOY_USER
pm2 save

echo ""
echo "✅ Deployment complete!"
echo "========================================="
echo "🌐 App running at: http://$(curl -s ifconfig.me):$PORT"
echo "========================================="