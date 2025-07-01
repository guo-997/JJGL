#!/bin/bash

# NFC家庭物品管理系统 - 自动化部署脚本
# 使用方法: ./deploy.sh

set -e  # 遇到错误时退出

# 配置变量
APP_NAME="nfc-home-manager"
APP_DIR="/var/www/${APP_NAME}"
GITHUB_REPO="https://github.com/guo-997/JJGL.git"
NODE_VERSION="18"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 开始部署 NFC家庭物品管理系统...${NC}"

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ 请使用root权限运行此脚本${NC}"
    exit 1
fi

# 1. 更新系统
echo -e "${YELLOW}📦 更新系统包...${NC}"
apt update && apt upgrade -y

# 2. 安装必要软件
echo -e "${YELLOW}🔧 安装必要软件...${NC}"
apt install -y curl git nginx software-properties-common

# 3. 安装Node.js
echo -e "${YELLOW}📦 安装 Node.js ${NODE_VERSION}...${NC}"
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt install -y nodejs

# 4. 安装PM2
echo -e "${YELLOW}🔧 安装 PM2...${NC}"
npm install -g pm2

# 5. 创建应用目录
echo -e "${YELLOW}📁 创建应用目录...${NC}"
mkdir -p ${APP_DIR}
mkdir -p ${APP_DIR}/logs
mkdir -p ${APP_DIR}/uploads

# 6. 克隆代码
echo -e "${YELLOW}📥 克隆代码...${NC}"
cd /tmp
if [ -d "JJGL" ]; then
    rm -rf JJGL
fi
git clone ${GITHUB_REPO}
cp -r JJGL/* ${APP_DIR}/
cd ${APP_DIR}

# 7. 安装依赖
echo -e "${YELLOW}📦 安装项目依赖...${NC}"
npm install --production

# 8. 设置环境配置
echo -e "${YELLOW}⚙️ 设置环境配置...${NC}"
if [ ! -f "${APP_DIR}/.env" ]; then
    cp ${APP_DIR}/deploy/production.env ${APP_DIR}/.env
    echo -e "${YELLOW}⚠️ 请编辑 ${APP_DIR}/.env 文件配置数据库连接信息${NC}"
fi

# 9. 设置文件权限
echo -e "${YELLOW}🔒 设置文件权限...${NC}"
chown -R www-data:www-data ${APP_DIR}
chmod -R 755 ${APP_DIR}
chmod -R 777 ${APP_DIR}/uploads
chmod -R 777 ${APP_DIR}/logs

# 10. 配置Nginx
echo -e "${YELLOW}🌐 配置 Nginx...${NC}"
cp ${APP_DIR}/deploy/nginx.conf /etc/nginx/sites-available/${APP_NAME}
ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 11. 启动应用
echo -e "${YELLOW}🚀 启动应用...${NC}"
cd ${APP_DIR}
pm2 delete ${APP_NAME} 2>/dev/null || true
pm2 start deploy/pm2.config.js --env production
pm2 save
pm2 startup

# 12. 启用服务自启动
echo -e "${YELLOW}🔄 配置服务自启动...${NC}"
systemctl enable nginx
systemctl start nginx

echo -e "${GREEN}✅ 部署完成！${NC}"
echo -e "${GREEN}📋 部署信息：${NC}"
echo -e "   应用目录: ${APP_DIR}"
echo -e "   日志目录: ${APP_DIR}/logs"
echo -e "   上传目录: ${APP_DIR}/uploads"
echo -e "   配置文件: ${APP_DIR}/.env"
echo ""
echo -e "${YELLOW}⚠️ 下一步操作：${NC}"
echo -e "1. 编辑配置文件: nano ${APP_DIR}/.env"
echo -e "2. 配置域名（如果需要）: nano /etc/nginx/sites-available/${APP_NAME}"
echo -e "3. 重启应用: pm2 restart ${APP_NAME}"
echo -e "4. 查看状态: pm2 status"
echo -e "5. 查看日志: pm2 logs ${APP_NAME}"
echo ""
echo -e "${GREEN}🎉 访问地址: http://your-server-ip:80${NC}" 