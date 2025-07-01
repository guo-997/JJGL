#!/bin/bash

# NFC家庭物品管理系统 - MySQL部署脚本
# 适用于CentOS系统

set -e  # 遇到错误时退出

# 配置变量
APP_NAME="nfc-home-manager"
APP_DIR="/var/www/${APP_NAME}"
GITHUB_REPO="https://github.com/guo-997/JJGL.git"
NODE_VERSION="18"
MYSQL_HOST="101.35.16.205"
MYSQL_USER="nfc_user"
MYSQL_PASS="Guo@112233"
MYSQL_DB="nfc_home_manager"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 开始部署 NFC家庭物品管理系统 (MySQL版本)...${NC}"

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ 请使用root权限运行此脚本${NC}"
    exit 1
fi

# 1. 安装EPEL仓库（CentOS需要）
echo -e "${YELLOW}📦 配置YUM仓库...${NC}"
yum install -y epel-release

# 2. 更新系统
echo -e "${YELLOW}📦 更新系统包...${NC}"
yum update -y

# 3. 安装必要软件
echo -e "${YELLOW}🔧 安装必要软件...${NC}"
yum install -y curl git nginx mysql

# 4. 安装Node.js
echo -e "${YELLOW}📦 安装 Node.js ${NODE_VERSION}...${NC}"
curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | bash -
yum install -y nodejs

# 5. 安装PM2
echo -e "${YELLOW}🔧 安装 PM2...${NC}"
npm install -g pm2

# 6. 创建应用目录
echo -e "${YELLOW}📁 创建应用目录...${NC}"
mkdir -p ${APP_DIR}
mkdir -p ${APP_DIR}/logs
mkdir -p ${APP_DIR}/uploads

# 7. 克隆代码
echo -e "${YELLOW}📥 克隆代码...${NC}"
cd /tmp
if [ -d "JJGL" ]; then
    rm -rf JJGL
fi
git clone ${GITHUB_REPO}
cp -r JJGL/* ${APP_DIR}/
cd ${APP_DIR}

# 8. 安装依赖
echo -e "${YELLOW}📦 安装项目依赖...${NC}"
npm install --production

# 9. 创建MySQL数据库和用户
echo -e "${YELLOW}🗄️ 配置MySQL数据库...${NC}"
mysql -h ${MYSQL_HOST} -u root -p${MYSQL_PASS} <<EOF
CREATE DATABASE IF NOT EXISTS ${MYSQL_DB} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'%' IDENTIFIED BY '${MYSQL_PASS}';
GRANT ALL PRIVILEGES ON ${MYSQL_DB}.* TO '${MYSQL_USER}'@'%';
FLUSH PRIVILEGES;
EOF

# 10. 导入数据库结构
echo -e "${YELLOW}📊 导入数据库结构...${NC}"
mysql -h ${MYSQL_HOST} -u ${MYSQL_USER} -p${MYSQL_PASS} ${MYSQL_DB} < ${APP_DIR}/deploy/mysql-setup.sql

# 11. 设置环境配置
echo -e "${YELLOW}⚙️ 设置环境配置...${NC}"
cat > ${APP_DIR}/.env <<EOL
# 生产环境配置
PORT=3000
NODE_ENV=production
HOST=0.0.0.0

# MySQL数据库配置
MYSQL_HOST=${MYSQL_HOST}
MYSQL_PORT=3306
MYSQL_USER=${MYSQL_USER}
MYSQL_PASSWORD=${MYSQL_PASS}
MYSQL_DATABASE=${MYSQL_DB}

# 前端URL
FRONTEND_URL=http://101.35.16.205

# 安全配置
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=24h

# 文件上传配置
MAX_FILE_SIZE=50000000
UPLOAD_PATH=${APP_DIR}/uploads

# 日志配置
LOG_LEVEL=info
EOL

# 12. 设置文件权限
echo -e "${YELLOW}🔒 设置文件权限...${NC}"
chown -R nginx:nginx ${APP_DIR}
chmod -R 755 ${APP_DIR}
chmod -R 777 ${APP_DIR}/uploads
chmod -R 777 ${APP_DIR}/logs

# 13. 配置Nginx
echo -e "${YELLOW}🌐 配置 Nginx...${NC}"
cat > /etc/nginx/conf.d/${APP_NAME}.conf <<'EOL'
server {
    listen 80;
    listen [::]:80;
    server_name 101.35.16.205;
    
    # 日志配置
    access_log /var/log/nginx/nfc-home-manager.access.log;
    error_log /var/log/nginx/nfc-home-manager.error.log;
    
    # 前端静态文件
    location / {
        root /var/www/nfc-home-manager/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # API路由代理到后端
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 文件上传处理
    location /uploads/ {
        alias /var/www/nfc-home-manager/uploads/;
    }
    
    client_max_body_size 50M;
}
EOL

# 14. 配置SELinux（如果启用）
echo -e "${YELLOW}🔐 配置SELinux...${NC}"
if command -v getenforce &> /dev/null && [ "$(getenforce)" != "Disabled" ]; then
    setsebool -P httpd_can_network_connect 1
    chcon -Rt httpd_sys_content_t ${APP_DIR}/frontend
    chcon -Rt httpd_sys_rw_content_t ${APP_DIR}/uploads
fi

# 15. 配置防火墙
echo -e "${YELLOW}🔥 配置防火墙...${NC}"
if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
fi

# 16. 启动Nginx
echo -e "${YELLOW}🌐 启动Nginx...${NC}"
systemctl enable nginx
systemctl restart nginx

# 17. 启动应用
echo -e "${YELLOW}🚀 启动应用...${NC}"
cd ${APP_DIR}
pm2 delete ${APP_NAME} 2>/dev/null || true
pm2 start backend/src/server.js --name ${APP_NAME} --env production
pm2 save
pm2 startup systemd -u root --hp /root

# 18. 显示部署信息
echo -e "${GREEN}✅ 部署完成！${NC}"
echo -e "${GREEN}📋 部署信息：${NC}"
echo -e "   应用目录: ${APP_DIR}"
echo -e "   日志目录: ${APP_DIR}/logs"
echo -e "   上传目录: ${APP_DIR}/uploads"
echo -e "   配置文件: ${APP_DIR}/.env"
echo -e "   数据库: ${MYSQL_DB}@${MYSQL_HOST}"
echo ""
echo -e "${YELLOW}📊 应用状态：${NC}"
pm2 status
echo ""
echo -e "${GREEN}🎉 访问地址: http://101.35.16.205${NC}"
echo ""
echo -e "${YELLOW}常用命令：${NC}"
echo -e "   查看状态: pm2 status"
echo -e "   查看日志: pm2 logs ${APP_NAME}"
echo -e "   重启应用: pm2 restart ${APP_NAME}"
 