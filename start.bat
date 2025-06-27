@echo off
echo 🚀 启动NFC家庭物品管理系统...

echo.
echo 📋 检查Node.js...
node --version
if %errorlevel% neq 0 (
    echo ❌ 请先安装Node.js
    pause
    exit /b 1
)

echo.
echo 📋 检查MongoDB...
mongo --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ 未检测到MongoDB，请确保MongoDB已安装并运行
)

echo.
echo 📦 安装依赖...
npm install

echo.
echo 🔧 创建环境配置...
if not exist .env (
    echo # NFC家庭物品管理系统配置 > .env
    echo MONGODB_URI=mongodb://localhost:27017/nfc-home-manager >> .env
    echo PORT=3000 >> .env
    echo NODE_ENV=development >> .env
    echo FRONTEND_URL=http://localhost:3000 >> .env
    echo JWT_SECRET=nfc-home-manager-secret-key-2025 >> .env
    echo JWT_EXPIRES_IN=24h >> .env
    echo MAX_FILE_SIZE=50000000 >> .env
    echo UPLOAD_PATH=./backend/uploads >> .env
    echo BCRYPT_ROUNDS=12 >> .env
    echo ✅ 环境配置文件已创建
) else (
    echo ✅ 环境配置文件已存在
)

echo.
echo 🌟 启动服务器...
echo 📱 前端地址: http://localhost:3000
echo 🔌 API地址: http://localhost:3000/api
echo.
echo 使用 Ctrl+C 停止服务器
echo.

npm start 