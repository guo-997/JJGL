#!/bin/bash

# NFC家庭物品管理系统 - 数据库初始化修复脚本
# 使用方法: bash fix-database-init.sh

echo "=== 修复数据库初始化问题 ==="

# 检查当前目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 设置工作目录
cd /opt/nfc-home-manager

echo "📍 当前工作目录: $(pwd)"
echo "📁 检查项目结构..."
ls -la

# 1. 更新 .env 文件中的数据库配置
echo "⚙️ 更新环境配置文件..."
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000

# 数据库配置 (使用正确的变量名)
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
EOF

echo "✅ 环境配置文件已更新"

# 2. 更新 PM2 配置文件
echo "⚙️ 更新PM2配置文件..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'nfc-home-manager',
    script: 'backend/src/server.js',
    instances: 1,  // 改为单实例以便调试
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
EOF

echo "✅ PM2配置文件已更新"

# 3. 测试数据库连接
echo "🔍 测试数据库连接..."
docker exec mysql_TXY mysql -unfc_user -pNfc@112233 nfc_home_manager -e "SELECT 1 as test;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ 数据库连接正常"
else
    echo "❌ 数据库连接失败，请检查数据库配置"
    exit 1
fi

# 4. 检查必要的目录和文件
echo "📁 检查项目文件结构..."
if [ ! -f "backend/src/server.js" ]; then
    echo "❌ 错误：未找到 backend/src/server.js"
    echo "📂 当前目录结构："
    find . -name "*.js" -type f | head -10
    exit 1
fi

if [ ! -f "backend/src/models/mysql/index.js" ]; then
    echo "❌ 错误：未找到 backend/src/models/mysql/index.js"
    echo "📂 检查models目录："
    find . -path "*/models/*" -name "*.js" -type f
    exit 1
fi

echo "✅ 项目文件结构正常"

# 5. 导入初始数据库结构（如果存在）
if [ -f "deploy/mysql-setup.sql" ]; then
    echo "📊 导入数据库初始结构..."
    docker exec -i mysql_TXY mysql -unfc_user -pNfc@112233 nfc_home_manager < deploy/mysql-setup.sql
    echo "✅ 数据库结构导入完成"
else
    echo "⚠️ 未找到数据库初始化SQL文件，将依靠应用自动创建表"
fi

# 6. 测试数据库初始化
echo "🔧 测试数据库初始化..."
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
    console.error('💡 详细错误信息:', error);
    process.exit(1);
  }
})();
" 2>&1

if [ $? -eq 0 ]; then
    echo "✅ 数据库初始化测试成功"
else
    echo "❌ 数据库初始化测试失败"
    echo "💡 尝试手动启动服务器进行初始化..."
fi

# 7. 设置文件权限
echo "🔒 设置文件权限..."
chown -R nfc-app:nfc-app /opt/nfc-home-manager
chmod 600 .env

# 8. 重启应用
echo "🚀 重启应用..."
# 先停止现有进程
sudo -u nfc-app pm2 delete nfc-home-manager 2>/dev/null || true

# 启动新进程
sudo -u nfc-app pm2 start ecosystem.config.js
sudo -u nfc-app pm2 save

# 9. 测试应用状态
echo "⏳ 等待应用启动..."
sleep 10

echo "📊 检查应用状态..."
sudo -u nfc-app pm2 status

echo "🔍 检查应用日志..."
sudo -u nfc-app pm2 logs nfc-home-manager --lines 20 || true

# 10. 测试HTTP访问
echo "🌐 测试HTTP访问..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ 应用启动成功，可以通过 http://101.35.16.205 访问"
else
    echo "⚠️ 应用可能未完全启动，请检查日志："
    echo "   sudo -u nfc-app pm2 logs nfc-home-manager"
fi

echo ""
echo "=== 修复脚本执行完成 ==="
echo "📝 如果仍有问题，请检查："
echo "   1. 查看应用日志: sudo -u nfc-app pm2 logs nfc-home-manager"
echo "   2. 查看应用状态: sudo -u nfc-app pm2 status"
echo "   3. 重启应用: sudo -u nfc-app pm2 restart nfc-home-manager"
echo "   4. 检查数据库: docker exec -it mysql_TXY mysql -unfc_user -pNfc@112233 nfc_home_manager" 