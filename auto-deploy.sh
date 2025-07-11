#!/bin/bash

# NFC家庭物品管理系统 - 自动化部署脚本
# 运行方式: bash auto-deploy.sh

set -e  # 出错时退出

echo "=== NFC家庭物品管理系统 自动化部署脚本 ==="
echo "开始时间: $(date)"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    log_error "请使用root用户运行此脚本"
    exit 1
fi

# 配置变量
DB_ROOT_PASSWORD="Gpw@112233"
DB_USER="nfc_user"
DB_PASSWORD="Nfc@112233"
DB_NAME="nfc_home_manager"
APP_DIR="/opt/nfc-home-manager"
APP_USER="nfc-app"

# 第一阶段：系统基础环境准备
log_info "第一阶段：更新系统和安装基础工具..."
yum update -y > /dev/null 2>&1
yum install -y wget curl vim git unzip epel-release > /dev/null 2>&1

# 配置时区
log_info "配置时区为上海..."
timedatectl set-timezone Asia/Shanghai

# 配置防火墙
log_info "配置防火墙..."
systemctl enable firewalld > /dev/null 2>&1
systemctl start firewalld > /dev/null 2>&1
firewall-cmd --permanent --add-port=22/tcp > /dev/null 2>&1
firewall-cmd --permanent --add-port=80/tcp > /dev/null 2>&1
firewall-cmd --permanent --add-port=443/tcp > /dev/null 2>&1
firewall-cmd --permanent --add-port=3000/tcp > /dev/null 2>&1
firewall-cmd --permanent --add-port=13306/tcp > /dev/null 2>&1
firewall-cmd --reload > /dev/null 2>&1

# 第二阶段：安装Docker
log_info "第二阶段：安装Docker..."
if ! command -v docker &> /dev/null; then
    yum install -y yum-utils > /dev/null 2>&1
    yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo > /dev/null 2>&1
    yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin > /dev/null 2>&1
    systemctl enable docker > /dev/null 2>&1
    systemctl start docker > /dev/null 2>&1
    log_info "Docker安装完成"
else
    log_info "Docker已安装，跳过"
fi

# 第三阶段：部署MySQL
log_info "第三阶段：部署MySQL数据库..."
mkdir -p /var/lib/mysql-data

# 检查MySQL容器是否已存在
if docker ps -a | grep -q mysql_TXY; then
    log_warn "MySQL容器已存在，正在删除旧容器..."
    docker stop mysql_TXY > /dev/null 2>&1 || true
    docker rm mysql_TXY > /dev/null 2>&1 || true
fi

# 启动MySQL容器
log_info "启动MySQL容器..."
docker run -d \
  --name mysql_TXY \
  --restart=always \
  -p 13306:3306 \
  -e MYSQL_ROOT_PASSWORD=$DB_ROOT_PASSWORD \
  -v /var/lib/mysql-data:/var/lib/mysql \
  mysql:8.0 > /dev/null 2>&1

# 等待MySQL启动
log_info "等待MySQL启动完成..."
sleep 30

# 创建数据库和用户
log_info "创建应用数据库和用户..."
docker exec mysql_TXY mysql -uroot -p$DB_ROOT_PASSWORD -e "
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
DROP USER IF EXISTS '$DB_USER'@'%';
CREATE USER '$DB_USER'@'%' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'%';
FLUSH PRIVILEGES;
" 2>/dev/null

# 测试数据库连接
if docker exec mysql_TXY mysql -u$DB_USER -p$DB_PASSWORD -h localhost $DB_NAME -e "SELECT 1;" > /dev/null 2>&1; then
    log_info "数据库连接测试成功"
else
    log_error "数据库连接测试失败"
    exit 1
fi

# 第四阶段：安装Node.js
log_info "第四阶段：安装Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash - > /dev/null 2>&1
    yum install -y nodejs > /dev/null 2>&1
    npm install -g pm2 > /dev/null 2>&1
    log_info "Node.js $(node --version) 安装完成"
else
    log_info "Node.js已安装: $(node --version)"
fi

# 第五阶段：创建应用用户和目录
log_info "第五阶段：创建应用用户和目录..."
if ! id "$APP_USER" &>/dev/null; then
    useradd -r -s /bin/false $APP_USER
    log_info "创建应用用户: $APP_USER"
else
    log_info "应用用户已存在: $APP_USER"
fi

mkdir -p $APP_DIR
mkdir -p $APP_DIR/uploads
mkdir -p $APP_DIR/logs
chown -R $APP_USER:$APP_USER $APP_DIR

# 第六阶段：询问源代码获取方式
log_warn "请选择源代码获取方式："
echo "1) GitHub仓库克隆"
echo "2) 手动上传（稍后需要手动上传代码到 $APP_DIR）"
read -p "请输入选择 (1/2): " CODE_SOURCE

case $CODE_SOURCE in
    1)
        read -p "请输入GitHub仓库URL: " REPO_URL
        if [ ! -z "$REPO_URL" ]; then
            log_info "克隆代码仓库..."
            rm -rf $APP_DIR/* 2>/dev/null || true
            git clone $REPO_URL $APP_DIR > /dev/null 2>&1
            chown -R $APP_USER:$APP_USER $APP_DIR
            log_info "代码克隆完成"
        else
            log_error "未提供仓库URL"
            exit 1
        fi
        ;;
    2)
        log_warn "请手动上传应用代码到目录: $APP_DIR"
        log_warn "完成后按任意键继续..."
        read -n 1
        ;;
    *)
        log_error "无效选择"
        exit 1
        ;;
esac

# 第七阶段：配置应用环境
log_info "第七阶段：配置应用环境..."
cd $APP_DIR

# 创建.env文件
cat > .env << EOF
NODE_ENV=production
PORT=3000

# 数据库配置
DB_HOST=127.0.0.1
DB_PORT=13306
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# JWT密钥
JWT_SECRET=$(openssl rand -hex 32)

# 文件上传配置
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880

# 日志配置
LOG_LEVEL=info
EOF

chmod 600 .env
chown $APP_USER:$APP_USER .env

# 安装依赖
if [ -f "package.json" ]; then
    log_info "安装应用依赖..."
    sudo -u $APP_USER npm install > /dev/null 2>&1
    log_info "依赖安装完成"
else
    log_warn "未找到package.json文件，跳过依赖安装"
fi

# 第八阶段：PM2配置
log_info "第八阶段：配置PM2..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'nfc-home-manager',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
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

chown $APP_USER:$APP_USER ecosystem.config.js

# 第九阶段：安装和配置Nginx
log_info "第九阶段：安装和配置Nginx..."
if ! command -v nginx &> /dev/null; then
    yum install -y nginx > /dev/null 2>&1
    systemctl enable nginx > /dev/null 2>&1
    log_info "Nginx安装完成"
else
    log_info "Nginx已安装"
fi

# 创建Nginx配置
cat > /etc/nginx/conf.d/nfc-home-manager.conf << 'EOF'
server {
    listen 80;
    server_name _;
    
    # 日志配置
    access_log /var/log/nginx/nfc-home-manager.access.log;
    error_log /var/log/nginx/nfc-home-manager.error.log;
    
    # 文件上传大小限制
    client_max_body_size 10M;
    
    # 静态文件
    location /static/ {
        alias /opt/nfc-home-manager/public/;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
    
    # 上传文件
    location /uploads/ {
        alias /opt/nfc-home-manager/uploads/;
        expires 1d;
    }
    
    # API 代理
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# 测试Nginx配置
if nginx -t > /dev/null 2>&1; then
    systemctl restart nginx > /dev/null 2>&1
    log_info "Nginx配置完成并重启"
else
    log_error "Nginx配置测试失败"
    exit 1
fi

# 第十阶段：设置监控和备份
log_info "第十阶段：设置系统监控..."

# 创建健康检查脚本
cat > /opt/health-check.sh << 'EOF'
#!/bin/bash

LOG_FILE="/var/log/nfc-health.log"

# 检查 Node.js 进程
if ! sudo -u nfc-app pm2 list | grep -q "online"; then
    echo "$(date): Node.js process is not running" >> $LOG_FILE
    sudo -u nfc-app pm2 restart nfc-home-manager
fi

# 检查 MySQL 连接
if ! docker exec mysql_TXY mysqladmin ping -h localhost --silent; then
    echo "$(date): MySQL is not responding" >> $LOG_FILE
    docker restart mysql_TXY
fi

# 检查 Nginx 状态
if ! systemctl is-active --quiet nginx; then
    echo "$(date): Nginx is not running" >> $LOG_FILE
    systemctl restart nginx
fi
EOF

chmod +x /opt/health-check.sh

# 创建备份脚本
cat > /opt/backup.sh << EOF
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=\$(date +%Y%m%d_%H%M%S)

mkdir -p \$BACKUP_DIR

# 备份数据库
docker exec mysql_TXY mysqldump -uroot -p$DB_ROOT_PASSWORD $DB_NAME > \$BACKUP_DIR/nfc_db_\$DATE.sql

# 备份应用文件
tar -czf \$BACKUP_DIR/nfc_app_\$DATE.tar.gz -C /opt nfc-home-manager --exclude='nfc-home-manager/node_modules' --exclude='nfc-home-manager/logs'

# 保留最近7天的备份
find \$BACKUP_DIR -name "*.sql" -mtime +7 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x /opt/backup.sh

# 添加定时任务
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/health-check.sh") | crontab -
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/backup.sh") | crontab -

log_info "监控和备份脚本配置完成"

# 第十一阶段：尝试启动应用
log_info "第十一阶段：启动应用..."

if [ -f "$APP_DIR/server.js" ]; then
    # 数据库初始化（如果需要）
    cd $APP_DIR
    if [ -f "models/database.js" ]; then
        log_info "初始化数据库表结构..."
        sudo -u $APP_USER node -e "
        const sequelize = require('./models/database');
        sequelize.sync({force: false}).then(() => {
          console.log('Database synchronized');
          process.exit(0);
        }).catch(err => {
          console.error('Database sync failed:', err);
          process.exit(1);
        });
        " 2>/dev/null || log_warn "数据库同步失败，可能需要手动处理"
    fi
    
    # 启动应用
    log_info "启动Node.js应用..."
    sudo -u $APP_USER pm2 start ecosystem.config.js > /dev/null 2>&1
    sudo -u $APP_USER pm2 save > /dev/null 2>&1
    
    # 测试应用
    sleep 5
    if curl -s http://localhost:3000 > /dev/null; then
        log_info "应用启动成功！"
    else
        log_warn "应用可能未正常启动，请检查日志"
    fi
else
    log_warn "未找到server.js文件，请手动启动应用"
fi

# 安装安全工具
log_info "安装安全工具..."
yum install -y fail2ban > /dev/null 2>&1
systemctl enable fail2ban > /dev/null 2>&1
systemctl start fail2ban > /dev/null 2>&1

# 部署完成总结
log_info "=== 部署完成 ==="
echo
echo "✅ 部署信息："
echo "   服务器IP: $(curl -s ifconfig.me 2>/dev/null || echo '101.35.16.205')"
echo "   网站访问: http://$(curl -s ifconfig.me 2>/dev/null || echo '101.35.16.205')"
echo "   应用目录: $APP_DIR"
echo "   数据库端口: 13306"
echo "   应用端口: 3000"
echo
echo "✅ 常用命令："
echo "   查看应用状态: sudo -u $APP_USER pm2 status"
echo "   查看应用日志: sudo -u $APP_USER pm2 logs"
echo "   重启应用: sudo -u $APP_USER pm2 restart nfc-home-manager"
echo "   查看数据库: docker exec -it mysql_TXY mysql -u$DB_USER -p$DB_PASSWORD $DB_NAME"
echo
echo "✅ 配置文件位置："
echo "   应用配置: $APP_DIR/.env"
echo "   Nginx配置: /etc/nginx/conf.d/nfc-home-manager.conf"
echo "   健康检查: /opt/health-check.sh"
echo "   备份脚本: /opt/backup.sh"
echo
log_info "部署脚本执行完成！"
echo "完成时间: $(date)" 