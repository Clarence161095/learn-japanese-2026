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

# Dùng luôn thư mục chứa project (cha của thư mục scripts/)
APP_DIR=$(dirname $(pwd))
PORT=3000
NODE_VERSION="20"

echo -e "${GREEN}🧹 Step 0: Clean up PM2 & Add Swap Memory (Fix EC2 Freeze)${NC}"

# Xoá hoàn toàn PM2 và các service liên quan
if command -v pm2 &> /dev/null; then
    echo "  Stopping and removing PM2..."
    pm2 kill 2>/dev/null || true
    sudo env PATH=$PATH:$(dirname $(which node)) $(which pm2) unstartup systemd -u ec2-user --hp /home/ec2-user 2>/dev/null || true
    sudo rm -f /etc/systemd/system/pm2-ec2-user.service
    sudo systemctl daemon-reload
    npm uninstall -g pm2
    rm -rf ~/.pm2
    echo "  PM2 removed."
fi

# Tạo Swap file 2GB (Giải quyết lỗi stuck npm install trên t2.micro)
if [ ! -f /swapfile ]; then
    echo "  Creating 2GB Swap file to prevent Out-Of-Memory..."
    sudo dd if=/dev/zero of=/swapfile bs=128M count=16
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo "/swapfile swap swap defaults 0 0" | sudo tee -a /etc/fstab
    echo "  Swap created successfully!"
else
    echo "  Swap file already exists. Moving on."
fi

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
# Xoá cache npm để giải phóng thêm bộ nhớ
npm cache clean --force
rm -rf node_modules package-lock.json
# Cài đặt (nhờ có Swap nên sẽ không bị stuck nữa)
npm install

echo -e "${GREEN}🔨 Step 6: Build Next.js project${NC}"
npm run build

echo -e "${GREEN}🌱 Step 7: Seed database${NC}"
npx tsx scripts/seed.ts

echo -e "${GREEN}🚀 Step 8: Starting Next.js App in Background...${NC}"

# Tắt các process Next.js hoặc tiến trình đang chiếm port 3000 cũ
echo "  Cleaning up old processes..."
if pgrep -f "next start" > /dev/null; then
    pkill -f "next start"
    sleep 2
fi
fuser -k $PORT/tcp 2>/dev/null || true

# Chạy Next.js ngầm bằng nohup
echo -e "${YELLOW}🔄 Starting server on 0.0.0.0:$PORT...${NC}"
nohup npx next start -H 0.0.0.0 -p $PORT > logs/output.log 2>&1 &

# Đợi app khởi động
sleep 4

# Kiểm tra xem tiến trình đã chạy thành công chưa
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