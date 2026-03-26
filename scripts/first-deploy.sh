#!/bin/bash
# ============================================================
# first-deploy.sh - Deploy & Start Next.js (Background Mode + Swap)
# ============================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Deploying and Starting 日本語マスター...${NC}"
echo "========================================="

APP_DIR=$(cd "$(dirname "$0")/.." && pwd)
PORT=3000
NODE_VERSION="20"

echo -e "${GREEN}🛡️ Step 0.1: Mở Port OS Firewall (UFW/Firewalld/Iptables)${NC}"
# Tự động mở port ở mức hệ điều hành
if command -v ufw >/dev/null 2>&1; then
    sudo ufw allow $PORT/tcp || true
elif command -v firewall-cmd >/dev/null 2>&1; then
    sudo firewall-cmd --zone=public --add-port=$PORT/tcp --permanent || true
    sudo firewall-cmd --reload || true
else
    sudo iptables -A INPUT -p tcp --dport $PORT -j ACCEPT || true
fi

echo -e "${GREEN}🧹 Step 0.2: Clean up PM2 & Swap check${NC}"
if command -v pm2 &> /dev/null; then
    pm2 kill 2>/dev/null || true
    sudo rm -f /etc/systemd/system/pm2-ec2-user.service || true
    npm uninstall -g pm2 || true
    rm -rf ~/.pm2
fi

if [ ! -f /swapfile ]; then
    sudo dd if=/dev/zero of=/swapfile bs=128M count=16
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo "/swapfile swap swap defaults 0 0" | sudo tee -a /etc/fstab
fi

echo -e "${GREEN}📦 Step 1-3: System & Node Setup${NC}"
export NVM_DIR="$HOME/.nvm"
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install $NODE_VERSION
nvm use $NODE_VERSION

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
fi

echo -e "${GREEN}📂 Step 5-7: Install, Build, Seed${NC}"
mkdir -p data/database data/backup data/imported logs
rm -rf node_modules package-lock.json
npm install
npm run build
npx tsx scripts/seed.ts

echo -e "${GREEN}🚀 Step 8: Starting Next.js App in Background...${NC}"
fuser -k $PORT/tcp 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true
sleep 2

echo -e "${YELLOW}🔄 Starting server on 0.0.0.0:$PORT...${NC}"
export PORT=$PORT
# FIX: Dùng biến môi trường HOSTNAME để ép binding 0.0.0.0 triệt để
HOSTNAME="0.0.0.0" nohup npx next start > "$APP_DIR/logs/output.log" 2>&1 &

sleep 5

if pgrep -f "next-server" > /dev/null || pgrep -f "next start" > /dev/null; then
    PUBLIC_IP=$(curl -s ifconfig.me)
    echo ""
    echo -e "${GREEN}🎉 App started successfully!${NC}"
    echo -e "${GREEN}✅ Listening on: 0.0.0.0:$PORT${NC}"
    echo "  Public URL: http://$PUBLIC_IP:$PORT"
    echo -e "  ${YELLOW}Xem Log:${NC} tail -f $APP_DIR/logs/output.log"
    echo -e "${RED}⚠️ LƯU Ý: Nếu URL vẫn quay đều/Refused, bắt buộc bạn phải vào AWS Console -> EC2 -> Security Groups -> Edit inbound rules -> Mở port 3000 (0.0.0.0/0). Script không thể bypass tường lửa của AWS.${NC}"
else
    echo -e "${RED}❌ Failed to start app. Please check the logs:${NC}"
    cat "$APP_DIR/logs/output.log"
    exit 1
fi