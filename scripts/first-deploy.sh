#!/bin/bash
# ============================================================
# first-deploy.sh - Deploy & Start Next.js (Background Mode + Swap)
# ============================================================

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Deploying and Starting 日本語マスター...${NC}"
echo "========================================="

# Lấy đường dẫn tuyệt đối của thư mục chứa project
APP_DIR=$(cd "$(dirname "$0")/.." && pwd)
PORT=3000
NODE_VERSION="20"

echo -e "${GREEN}🧹 Step 0: Clean up PM2 & Add Swap Memory${NC}"
if command -v pm2 &> /dev/null; then
    pm2 kill 2>/dev/null || true
    sudo rm -f /etc/systemd/system/pm2-ec2-user.service || true
    npm uninstall -g pm2 || true
    rm -rf ~/.pm2
fi

if [ ! -f /swapfile ]; then
    echo "  Creating 2GB Swap file to prevent Out-Of-Memory..."
    sudo dd if=/dev/zero of=/swapfile bs=128M count=16
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo "/swapfile swap swap defaults 0 0" | sudo tee -a /etc/fstab
fi

echo -e "${GREEN}📦 Step 1: System update & dependencies${NC}"
sudo yum update -y
sudo yum install -y curl git gcc-c++ make openssl-devel --allowerasing

echo -e "${GREEN}📦 Step 2: Install Node.js $NODE_VERSION${NC}"
export NVM_DIR="$HOME/.nvm"
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install $NODE_VERSION
nvm use $NODE_VERSION

echo -e "${GREEN}📁 Step 3: Setting working directory to $APP_DIR${NC}"
cd "$APP_DIR"

echo -e "${GREEN}🔑 Step 4: Environment configuration${NC}"
# Đảm bảo luôn có file .env với HOSTNAME=0.0.0.0 để Next.js mở port ra ngoài
JWT_SECRET=$(openssl rand -hex 32)
cat > .env << EOF
JWT_SECRET=$JWT_SECRET
DATABASE_PATH=./data/database/nihongo.db
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin2026
HOSTNAME=0.0.0.0
PORT=$PORT
EOF

echo -e "${GREEN}📂 Step 5: Setup directories & Install dependencies${NC}"
mkdir -p data/database data/backup data/imported logs
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

echo -e "${GREEN}🔨 Step 6: Build Next.js project${NC}"
npm run build

echo -e "${GREEN}🌱 Step 7: Seed database${NC}"
npx tsx scripts/seed.ts

echo -e "${GREEN}🚀 Step 8: Starting Next.js App in Background...${NC}"

# Dọn dẹp tiến trình cũ
echo "  Cleaning up old processes..."
fuser -k $PORT/tcp 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true
pkill -f "next start" 2>/dev/null || true
sleep 2

# Chạy Next.js ngầm bằng nohup. Truyền trực tiếp biến môi trường.
echo -e "${YELLOW}🔄 Starting server on 0.0.0.0:$PORT...${NC}"
export HOSTNAME="0.0.0.0"
export PORT=$PORT
nohup npm run start > "$APP_DIR/logs/output.log" 2>&1 &

# Đợi app khởi động
sleep 5

# Kiểm tra xem tiến trình đã chạy thành công chưa
if pgrep -f "next-server" > /dev/null || pgrep -f "next start" > /dev/null; then
    PUBLIC_IP=$(curl -s ifconfig.me)
    echo ""
    echo -e "${GREEN}🎉 App started successfully!${NC}"
    echo "======================================"
    echo -e "${GREEN}✅ Listening on: 0.0.0.0:$PORT${NC}"
    echo ""
    echo -e "${YELLOW}📊 Access URLs:${NC}"
    echo "  Public:   http://$PUBLIC_IP:$PORT"
    echo ""
    echo -e "${YELLOW}📝 Copy lệnh dưới đây để xem Log (đường dẫn tuyệt đối):${NC}"
    echo -e "  ${GREEN}tail -f $APP_DIR/logs/output.log${NC}"
    echo "======================================"
else
    echo -e "${RED}❌ Failed to start app. Please check the logs:${NC}"
    cat "$APP_DIR/logs/output.log"
    exit 1
fi