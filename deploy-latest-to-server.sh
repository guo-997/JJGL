#!/bin/bash

# 将最新代码部署到服务器的脚本
# 使用方法: bash deploy-latest-to-server.sh

echo "=== 部署最新代码到服务器 ==="

# 服务器信息
SERVER_IP="101.35.16.205"
SERVER_USER="root"
SERVER_PASS="Guo@112233"

# 本地项目目录
LOCAL_DIR="C:/PM/JJGL"
TEMP_ARCHIVE="/tmp/nfc-latest-$(date +%Y%m%d_%H%M%S).tar.gz"

echo "📦 打包本地最新代码..."

# 创建临时目录并打包代码（排除不需要的文件）
cd "$LOCAL_DIR"
tar -czf "$TEMP_ARCHIVE" \
    --exclude=node_modules \
    --exclude=.git \
    --exclude="*.log" \
    --exclude=uploads \
    --exclude=logs \
    .

echo "✅ 代码打包完成: $TEMP_ARCHIVE"

echo "📤 上传代码到服务器..."

# 使用scp上传文件
scp "$TEMP_ARCHIVE" "${SERVER_USER}@${SERVER_IP}:/tmp/"

echo "🚀 在服务器上部署代码..."

# 在服务器上执行部署命令
ssh "${SERVER_USER}@${SERVER_IP}" << 'REMOTE_SCRIPT'
    echo "=== 服务器端部署开始 ==="
    
    # 设置变量
    APP_DIR="/opt/nfc-home-manager"
    BACKUP_DIR="/opt/nfc-home-manager-backup-$(date +%Y%m%d_%H%M%S)"
    TEMP_FILE="/tmp/nfc-latest-*.tar.gz"
    
    # 停止现有应用
    echo "⏹️ 停止现有应用..."
    sudo -u nfc-app pm2 delete nfc-home-manager 2>/dev/null || true
    
    # 备份现有代码
    if [ -d "$APP_DIR" ]; then
        echo "💾 备份现有代码到 $BACKUP_DIR"
        mv "$APP_DIR" "$BACKUP_DIR"
    fi
    
    # 创建新的应用目录
    echo "📁 创建应用目录..."
    mkdir -p "$APP_DIR"
    cd "$APP_DIR"
    
    # 解压最新代码
    echo "📦 解压最新代码..."
    LATEST_ARCHIVE=$(ls -t /tmp/nfc-latest-*.tar.gz | head -1)
    tar -xzf "$LATEST_ARCHIVE"
    
    # 创建必要目录
    mkdir -p uploads logs
    
    # 安装依赖
    echo "📦 安装项目依赖..."
    npm install --production
    
    # 创建环境配置文件
    echo "⚙️ 创建环境配置..."
    cat > .env << 'ENV_EOF'
NODE_ENV=production
PORT=3000

# 数据库配置
MYSQL_HOST=127.0.0.1
MYSQL_PORT=13306
MYSQL_DATABASE=nfc_home_manager
MYSQL_USER=nfc_user
MYSQL_PASSWORD=Nfc@112233

# JWT密钥
JWT_SECRET=nfc-home-manager-super-secret-key-2024

# 前端URL
FRONTEND_URL=http://101.35.16.205

# 文件上传配置
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880

# 日志配置
LOG_LEVEL=info
ENV_EOF
    
    # 创建PM2配置
    echo "⚙️ 创建PM2配置..."
    cat > ecosystem.config.js << 'PM2_EOF'
module.exports = {
  apps: [{
    name: 'nfc-home-manager',
    script: 'backend/src/server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
PM2_EOF
    
    # 设置文件权限
    echo "🔒 设置文件权限..."
    chown -R nfc-app:nfc-app "$APP_DIR"
    chmod 600 .env
    
    # 测试数据库初始化
    echo "🔧 初始化数据库..."
    node -e "
    require('dotenv').config();
    const { testConnection, syncDatabase } = require('./backend/src/models/mysql');
    (async () => {
      try {
        console.log('🔗 测试数据库连接...');
        await testConnection();
        console.log('📊 同步数据库表结构...');
        await syncDatabase();
        console.log('✅ 数据库初始化成功！');
        process.exit(0);
      } catch (error) {
        console.error('❌ 数据库初始化失败:', error.message);
        process.exit(1);
      }
    })();
    " || echo "⚠️ 数据库初始化失败，但继续启动应用..."
    
    # 启动应用
    echo "🚀 启动应用..."
    sudo -u nfc-app pm2 start ecosystem.config.js
    sudo -u nfc-app pm2 save
    
    # 等待应用启动
    echo "⏳ 等待应用启动..."
    sleep 10
    
    # 检查应用状态
    echo "📊 检查应用状态..."
    sudo -u nfc-app pm2 status
    
    # 测试HTTP访问
    echo "🌐 测试HTTP访问..."
    if curl -s http://localhost:3000 > /dev/null; then
        echo "✅ 应用启动成功！"
        echo "🌍 可以通过以下地址访问:"
        echo "   http://101.35.16.205"
    else
        echo "⚠️ 应用可能未完全启动，查看日志:"
        sudo -u nfc-app pm2 logs nfc-home-manager --lines 10
    fi
    
    # 清理临时文件
    rm -f /tmp/nfc-latest-*.tar.gz
    
    echo "=== 服务器端部署完成 ==="
REMOTE_SCRIPT

# 清理本地临时文件
rm -f "$TEMP_ARCHIVE"

echo ""
echo "=== 部署完成 ==="
echo "🌍 访问地址: http://101.35.16.205"
echo "📝 如需查看日志: ssh root@101.35.16.205 'sudo -u nfc-app pm2 logs nfc-home-manager'" 