#!/bin/bash

echo "🔄 配置应用运行在80端口..."

# 停止现有应用
sudo -u nfc-app pm2 stop nfc-home-manager 2>/dev/null || true
sudo -u nfc-app pm2 delete nfc-home-manager 2>/dev/null || true

# 停止任何在80端口运行的服务
pkill -f "node.*3000" 2>/dev/null || true
pkill -f "node.*80" 2>/dev/null || true

cd /opt/nfc-home-manager

echo "🚀 以root权限启动应用在80端口..."

# 设置环境变量
export NODE_ENV=production
export PORT=80
export MYSQL_HOST=127.0.0.1
export MYSQL_PORT=13306  
export MYSQL_DATABASE=nfc_home_manager
export MYSQL_USER=nfc_user
export MYSQL_PASSWORD=Nfc@112233
export JWT_SECRET=your-super-secret-jwt-key-change-this
export FRONTEND_URL=http://101.35.16.205

# 以root权限启动在80端口
pm2 start backend/src/server.js --name "nfc-manager-web" --env production

echo "✅ 应用已启动在80端口"
echo "🌐 访问地址: http://101.35.16.205"
echo ""
echo "PM2状态:"
pm2 status

echo ""
echo "如果仍无法访问，请检查云服务器安全组是否开放了80端口" 