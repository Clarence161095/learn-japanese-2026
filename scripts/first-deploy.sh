#!/bin/bash
# ============================================================
# first-deploy.sh - Deploy & Start Next.js (Background Mode)
# ============================================================

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Deploying and Starting 日本語マスター...${NC}"
echo "========================================="

# Dùng luôn thư mục chứa project (cha của thư mục scripts/)
APP_DIR=$(dirname $(pwd))
PORT=3000
NODE_VERSION="20"

echo -e "${GREEN}📦 Step 1: System update & dependencies${NC}"
sudo yum update -y
sudo yum install -y curl git gcc-c++ make openssl-devel --allowerasing

echo -e "${GREEN}📦 Step 2: Install Node.js $NODE_VERSION${NC}"
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install $NODE_VERSION
nvm use $NODE_VERSION

echo -e "${GREEN}📁 Step 3: Setting working directory to $APP_DIR${NC}"
cd "$APP_DIR"

echo -e "${GREEN}🔑 Step 4: Environment configuration${NC}"
if [ ! -f ".env" ]; then
    JWT_SECRET=$(openssl rand -hex 32)
    cat > .env << EOF
JWT_SECRET=$JWT_SECRET
DATABASE_PATH=./data/database/nihongo.db
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin2026
EOF
    echo "  Created .env file."
fi

echo -e "${GREEN}📂 Step 5: Setup directories & Install dependencies${NC}"
mkdir -p data/database data/backup data/imported logs
rm -rf node_modules package-lock.json
npm install

echo -e "${GREEN}🔨 Step 6: Build Next.js project${NC}"
npm run build

echo -e "${GREEN}🌱 Step 7: Seed database${NC}"
npx tsx scripts/seed.ts

echo -e "${GREEN}🚀 Step 8: Starting Next.js App in Background...${NC}"
# 1. Tắt PM2 cũ (nếu có) để tránh xung đột
pm2 delete all 2>/dev/null || true

# 2. Tắt các process Next.js hoặc tiến trình đang chiếm port 3000 cũ
echo "  Cleaning up old processes..."
if pgrep -f "next start" > /dev/null; then
    pkill -f "next start"
    sleep 2
fi
fuser -k $PORT/tcp 2>/dev/null || true

# 3. Chạy Next.js ngầm bằng nohup (Giống y hệt cách Gunicorn --daemon chạy)
echo -e "${YELLOW}🔄 Starting server on 0.0.0.0:$PORT...${NC}"
# Ép Next.js bind vào 0.0.0.0 thông qua flag -H
nohup npx next start -H 0.0.0.0 -p $PORT > logs/output.log 2>&1 &

# Đợi app khởi động
sleep 4

# 4. Kiểm tra xem tiến trình đã chạy thành công chưa
if pgrep -f "next start" > /dev/null; then
    PID=$(pgrep -f "next start" | head -1)
    PUBLIC_IP=$(curl -s ifconfig.me)
    echo ""
    echo -e "${GREEN}🎉 App started successfully!${NC}"
    echo "======================================"
    echo ""
    echo -e "${GREEN}✅ Process ID: $PID${NC}"
    echo -e "${GREEN}✅ Listening on: 0.0.0.0:$PORT${NC}"
    echo ""
    echo -e "${YELLOW}📊 Access URLs:${NC}"
    echo "  Local:    http://localhost:$PORT"
    echo "  Network:  http://$(hostname -I | awk '{print $1}'):$PORT"
    if [ -n "$PUBLIC_IP" ]; then
        echo "  Public:   http://$PUBLIC_IP:$PORT"
    fi
    echo ""
    echo -e "${YELLOW}📝 Logs:${NC}"
    echo "  View logs: tail -f logs/output.log"
    echo ""
    echo -e "${YELLOW}🛑 To stop:${NC}"
    echo "  pkill -f 'next start'"
    echo "======================================"
else
    echo -e "${RED}❌ Failed to start app${NC}"
    echo "Check logs/output.log for details:"
    cat logs/output.log
    exit 1
fi