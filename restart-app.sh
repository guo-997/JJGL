#!/bin/bash

echo "🔄 重启NFC家庭物品管理系统..."

# 停止现有进程
sudo -u nfc-app pm2 stop nfc-home-manager 2>/dev/null || true
sudo -u nfc-app pm2 delete nfc-home-manager 2>/dev/null || true

# 以root权限在80端口启动（临时解决方案）
cd /opt/nfc-home-manager

# 更新环境变量
export NODE_ENV=production
export PORT=80
export MYSQL_HOST=127.0.0.1
export MYSQL_PORT=13306
export MYSQL_DATABASE=nfc_home_manager
export MYSQL_USER=nfc_user
export MYSQL_PASSWORD=Nfc@112233

# 启动应用
pm2 start backend/src/server.js --name "nfc-home-manager-80" --env production

echo "✅ 应用已启动在端口80"
echo "🌐 访问地址: http://101.35.16.205"

pm2 status 