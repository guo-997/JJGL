#!/bin/bash

# NFC家庭物品管理系统 - Docker部署脚本
# 适用于CentOS Stream 9

set -e  # 遇到错误时退出

# 配置变量
APP_NAME="nfc-home-manager"
PROJECT_DIR="/opt/${APP_NAME}"
GITHUB_REPO="https://github.com/guo-997/JJGL.git"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🐳 开始Docker部署 NFC家庭物品管理系统...${NC}"

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ 请使用root权限运行此脚本${NC}"
    exit 1
fi

# 1. 安装Docker
echo -e "${YELLOW}🐳 安装Docker...${NC}"
dnf update -y
dnf install -y docker docker-compose

# 启动Docker服务
systemctl enable docker
systemctl start docker

# 验证Docker安装
docker --version
docker-compose --version

# 2. 创建项目目录
echo -e "${YELLOW}📁 创建项目目录...${NC}"
mkdir -p ${PROJECT_DIR}
cd ${PROJECT_DIR}

# 3. 克隆或更新代码
echo -e "${YELLOW}📥 获取项目代码...${NC}"
if [ -d ".git" ]; then
    echo "更新现有代码..."
    git pull
else
    echo "克隆新代码..."
    git clone ${GITHUB_REPO} .
fi

# 4. 复制Docker配置文件
echo -e "${YELLOW}📋 配置Docker文件...${NC}"
cp docker-compose.prod.yml docker-compose.yml
cp Dockerfile.prod Dockerfile
cp nginx.prod.conf nginx.conf

# 5. 创建必要目录
mkdir -p uploads logs

# 6. 设置文件权限
chmod 755 uploads logs

# 7. 测试MySQL连接
echo -e "${YELLOW}🔍 测试MySQL连接...${NC}"
if command -v mysql &> /dev/null; then
    mysql -h 101.35.16.205 -P 13306 -u nfc_user -pGuo@112233 -e "SELECT 1;" 2>/dev/null && echo "MySQL连接成功" || echo "MySQL连接失败，请检查数据库配置"
else
    echo "MySQL客户端未安装，跳过连接测试"
fi

# 8. 构建并启动容器
echo -e "${YELLOW}🏗️ 构建Docker镜像...${NC}"
docker-compose build --no-cache

echo -e "${YELLOW}🚀 启动容器...${NC}"
docker-compose up -d

# 9. 等待服务启动
echo -e "${YELLOW}⏳ 等待服务启动...${NC}"
sleep 30

# 10. 检查容器状态
echo -e "${YELLOW}📊 检查容器状态...${NC}"
docker-compose ps

# 11. 检查应用健康状态
echo -e "${YELLOW}🔍 检查应用健康状态...${NC}"
if curl -f http://localhost/api/health 2>/dev/null; then
    echo -e "${GREEN}✅ 应用健康检查通过${NC}"
else
    echo -e "${RED}❌ 应用健康检查失败${NC}"
    echo "查看应用日志："
    docker-compose logs app
fi

# 12. 配置防火墙
echo -e "${YELLOW}🔥 配置防火墙...${NC}"
if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
    echo "防火墙配置完成"
else
    echo "firewall-cmd未找到，请手动配置防火墙开放80端口"
fi

# 13. 显示部署信息
echo -e "${GREEN}✅ Docker部署完成！${NC}"
echo -e "${GREEN}📋 部署信息：${NC}"
echo -e "   项目目录: ${PROJECT_DIR}"
echo -e "   日志目录: ${PROJECT_DIR}/logs"
echo -e "   上传目录: ${PROJECT_DIR}/uploads"
echo -e "   Docker配置: docker-compose.yml"
echo ""
echo -e "${YELLOW}📊 容器状态：${NC}"
docker-compose ps
echo ""
echo -e "${GREEN}🎉 访问地址: http://101.35.16.205${NC}"
echo ""
echo -e "${YELLOW}常用命令：${NC}"
echo -e "   查看容器状态: docker-compose ps"
echo -e "   查看应用日志: docker-compose logs app"
echo -e "   查看Nginx日志: docker-compose logs nginx"
echo -e "   重启服务: docker-compose restart"
echo -e "   停止服务: docker-compose down"
echo -e "   更新部署: docker-compose down && docker-compose build --no-cache && docker-compose up -d" 