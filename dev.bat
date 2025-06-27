@echo off
echo 🛠️ 启动开发模式...

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
)

echo.
echo 🌟 启动开发服务器（自动重启）...
echo 📱 前端地址: http://localhost:3000
echo 🔌 API地址: http://localhost:3000/api
echo.

npm run dev 