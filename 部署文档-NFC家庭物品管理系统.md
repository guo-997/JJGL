# NFC家庭物品管理系统 - 服务器部署文档

## 项目信息
- **项目名称**: NFC家庭物品管理系统
- **服务器**: 101.35.16.205
- **操作系统**: CentOS Stream 9
- **技术栈**: Node.js + Express + MySQL + Nginx + PM2

## 第一阶段：服务器基础环境准备

### 1.1 操作系统安装
- [ ] 安装 CentOS Stream 9
- [ ] 设置 root 用户密码：`Guo@112233`
- [ ] 配置网络，确保服务器IP为：101.35.16.205
- [ ] 启用SSH服务

### 1.2 系统基础配置
```bash
# 更新系统
yum update -y

# 安装基础工具
yum install -y wget curl vim git unzip

# 配置时区
timedatectl set-timezone Asia/Shanghai

# 配置防火墙
systemctl enable firewalld     #设置 firewalld 服务在系统开机时自动启动。
systemctl start firewalld       #启动 firewalld 服务
systemctl status firewalld      #查看防火墙状态
firewall-cmd --permanent --add-port=22/tcp
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --permanent --add-port=13306/tcp
firewall-cmd --reload       # 重新加载防火墙规则
```
firewall-cmd --list-ports       #查看已打开的端口
## 第二阶段：数据库安装配置

### 2.1 Docker 安装
```bash
# 安装 Docker
yum install -y yum-utils #安装 yum-utils 工具
yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo               官网源
yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo      阿里源正常使用这个   #创建docker-compose.yml文件
yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin         #安装 Docker

# 启动 Docker
systemctl enable docker       # 设置 Docker 服务为 “开机自启动
systemctl start docker        #立即启动 Docker
```
# 查看Docker运行状态（应显示“active (running)”）
systemctl status docker


### 2.2 MySQL 容器部署
```bash
# 创建 MySQL 数据目录
mkdir -p /var/lib/mysql-data
#需要先创建一个镜像源地址文件，主要7用于无法访问官方源的情况下
vim /etc/docker/daemon.json
#腾讯云源
{
  "registry-mirrors": ["https://mirror.ccs.tencentyun.com"]
}

#重启 Docker 服务
systemctl daemon-reload  # 重新加载配置
systemctl restart docker  # 重启Docker服务
docker info | grep -A 5 "Registry Mirrors"   #  验证镜像源是否成功

# 运行 MySQL 容器
docker run -d \
  --name mysql_TXY \
  --restart=always \
  -p 13306:3306 \
  -e MYSQL_ROOT_PASSWORD=Gpw@112233 \
  -v /var/lib/mysql-data:/var/lib/mysql \
  mysql:8.0

# 等待 MySQL 启动完成
sleep 30



docker ps -a    # 查看所有容器  
#数据库连接测试
docker exec -it mysql_TXY mysql -uroot -pGpw@112233 -e "SELECT 1;"


# 创建应用数据库和用户
docker exec -it mysql_TXY mysql -uroot -pGpw@112233 -e "
CREATE DATABASE nfc_home_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'nfc_user'@'%' IDENTIFIED BY 'Nfc@112233';
GRANT ALL PRIVILEGES ON nfc_home_manager.* TO 'nfc_user'@'%';
FLUSH PRIVILEGES;
"
```

### 2.3 数据库连接测试
```bash
# 测试数据库连接
docker exec -it mysql_TXY mysql -unfc_user -pNfc@112233 -h localhost nfc_home_manager -e "SELECT 1;"
```

## 第三阶段：Node.js 环境搭建

### 3.1 Node.js 安装
```bash
# 安装 Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# 验证安装
node --version
npm --version

# 全局安装 PM2
npm install -g pm2
```

### 3.2 创建应用目录
```bash
# 创建应用目录
mkdir -p /opt/nfc-home-manager
cd /opt/nfc-home-manager

# 创建应用用户
useradd -r -s /bin/false nfc-app
chown -R nfc-app:nfc-app /opt/nfc-home-manager
```

## 第四阶段：应用程序部署

### 4.1 获取源代码
根据源代码获取方式选择：

**选项A: 如果有GitHub仓库**
```bash
# 克隆代码
git clone https://github.com/guo-997/JJGL.git /opt/nfc-home-manager
cd /opt/nfc-home-manager
```

**选项B: 如果需要手动上传**
```bash
# 在本地压缩项目文件
# 上传到服务器 /opt/nfc-home-manager
# 解压文件
```

### 4.2 安装依赖和配置
```bash
cd /opt/nfc-home-manager

# 安装依赖
npm install

# 创建环境配置文件
cat > .env << EOF
NODE_ENV=production
PORT=3000

# 数据库配置 (注意：这里使用MYSQL_开头的变量名)
MYSQL_HOST=127.0.0.1
MYSQL_PORT=13306
MYSQL_DATABASE=nfc_home_manager
MYSQL_USER=nfc_user
MYSQL_PASSWORD=Nfc@112233

# JWT密钥（请更换为随机字符串）
JWT_SECRET=your-super-secret-jwt-key-change-this

# 前端URL
FRONTEND_URL=http://101.35.16.205

# 文件上传配置
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880

# 日志配置
LOG_LEVEL=info
EOF

# 创建上传目录
mkdir -p uploads
mkdir -p logs

# 设置权限
chown -R nfc-app:nfc-app /opt/nfc-home-manager
chmod -R 755 /opt/nfc-home-manager
chmod 600 .env
```

### 4.3 数据库初始化
```bash
# 导入初始化数据库结构（如果存在SQL文件）
if [ -f "deploy/mysql-setup.sql" ]; then
    echo "导入数据库初始化SQL..."
    docker exec -i mysql_TXY mysql -unfc_user -pNfc@112233 nfc_home_manager < deploy/mysql-setup.sql
fi

# 使用Node.js初始化数据库表结构
echo "初始化数据库表结构..."
node -e "
const { testConnection, syncDatabase } = require('./backend/src/models/mysql');
(async () => {
  try {
    await testConnection();
    await syncDatabase();
    console.log('✅ 数据库初始化成功');
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
})();
"

# 或者直接启动服务器（服务器启动时会自动初始化数据库）
echo "数据库会在服务器启动时自动初始化"
```

## 第五阶段：进程管理配置

### 5.1 PM2 配置
```bash
cd /opt/nfc-home-manager

# 创建 PM2 配置文件
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'nfc-home-manager',
    script: 'backend/src/server.js',
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

# 启动应用
sudo -u nfc-app pm2 start ecosystem.config.js
sudo -u nfc-app pm2 save
sudo -u nfc-app pm2 startup

# 测试应用
curl http://localhost:3000
```

## 第六阶段：Nginx 反向代理

### 6.1 Nginx 安装
```bash
# 安装 Nginx
yum install -y nginx

# 启动并设置自启动
systemctl enable nginx
systemctl start nginx
```

### 6.2 Nginx 配置
```bash
# 创建网站配置
cat > /etc/nginx/conf.d/nfc-home-manager.conf << 'EOF'
server {
    listen 80;
    server_name 101.35.16.205;
    
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

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
```

## 第七阶段：SSL证书配置（可选）

### 7.1 安装 Certbot
```bash
# 安装 Certbot
yum install -y python3-certbot-nginx

# 获取SSL证书（需要域名）
# certbot --nginx -d yourdomain.com
```

## 第八阶段：系统监控和日志

### 8.1 日志管理
```bash
# 创建日志轮转配置
cat > /etc/logrotate.d/nfc-home-manager << 'EOF'
/opt/nfc-home-manager/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
    su nfc-app nfc-app
}
EOF

# 创建 Nginx 日志轮转
cat > /etc/logrotate.d/nginx-nfc << 'EOF'
/var/log/nginx/nfc-home-manager.*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    postrotate
        systemctl reload nginx
    endscript
}
EOF
```

### 8.2 系统监控脚本
```bash
# 创建健康检查脚本
cat > /opt/nfc-home-manager/health-check.sh << 'EOF'
#!/bin/bash

# 检查 Node.js 进程
if ! sudo -u nfc-app pm2 list | grep -q "online"; then
    echo "$(date): Node.js process is not running" >> /var/log/nfc-health.log
    sudo -u nfc-app pm2 restart nfc-home-manager
fi

# 检查 MySQL 连接
if ! docker exec mysql_TXY mysqladmin ping -h localhost --silent; then
    echo "$(date): MySQL is not responding" >> /var/log/nfc-health.log
    docker restart mysql_TXY
fi

# 检查 Nginx 状态
if ! systemctl is-active --quiet nginx; then
    echo "$(date): Nginx is not running" >> /var/log/nfc-health.log
    systemctl restart nginx
fi
EOF

chmod +x /opt/nfc-home-manager/health-check.sh

# 添加到 crontab
echo "*/5 * * * * /opt/nfc-home-manager/health-check.sh" | crontab -
```

## 第九阶段：安全配置

### 9.1 系统安全
```bash
# 禁用 root 远程登录（可选）
# sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
# systemctl restart sshd

# 安装 fail2ban
yum install -y epel-release
yum install -y fail2ban

# 配置 fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

### 9.2 数据库安全
```bash
# 运行 MySQL 安全配置
docker exec -it mysql_TXY mysql_secure_installation
```

## 第十阶段：部署验证

### 10.1 功能测试清单
- [ ] 访问 http://101.35.16.205 能正常显示网站
- [ ] 用户注册功能正常
- [ ] 用户登录功能正常
- [ ] NFC 标签管理功能正常
- [ ] 物品管理功能正常
- [ ] 图片上传功能正常
- [ ] 数据库操作正常

### 10.2 性能测试
```bash
# 简单性能测试
curl -w "@curl-format.txt" -o /dev/null -s http://101.35.16.205/

# 创建 curl 格式文件
cat > curl-format.txt << 'EOF'
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
EOF
```

## 维护命令备忘

### 常用操作命令
```bash
# 查看应用状态
sudo -u nfc-app pm2 status

# 查看应用日志
sudo -u nfc-app pm2 logs nfc-home-manager

# 重启应用
sudo -u nfc-app pm2 restart nfc-home-manager

# 查看 MySQL 状态
docker ps | grep mysql_TXY

# 查看 Nginx 状态
systemctl status nginx

# 查看系统资源
htop

# 查看磁盘空间
df -h
```

### 备份脚本
```bash
# 创建备份脚本
cat > /opt/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份数据库
docker exec mysql_TXY mysqldump -uroot -pGpw@112233 nfc_home_manager > $BACKUP_DIR/nfc_db_$DATE.sql

# 备份应用文件
tar -czf $BACKUP_DIR/nfc_app_$DATE.tar.gz -C /opt nfc-home-manager

# 保留最近7天的备份
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x /opt/backup.sh

# 添加到 crontab（每天凌晨2点备份）
echo "0 2 * * * /opt/backup.sh" | crontab -
```

## 故障排除

### 常见问题
1. **应用无法启动**: 检查 `.env` 文件配置和数据库连接
2. **数据库连接失败**: 检查 MySQL 容器状态和端口配置
3. **文件上传失败**: 检查 `uploads` 目录权限
4. **Nginx 502 错误**: 检查 Node.js 应用是否正常运行
5. **内存不足**: 调整 PM2 配置中的 `max_memory_restart` 参数

### 日志位置
- 应用日志: `/opt/nfc-home-manager/logs/`
- Nginx 日志: `/var/log/nginx/`
- 系统日志: `/var/log/messages`
- MySQL 日志: `docker logs mysql_TXY`

---

**部署完成后记录以下信息：**
- 服务器IP: 101.35.16.205
- 网站访问地址: http://101.35.16.205
- 数据库连接: 127.0.0.1:13306
- 应用目录: /opt/nfc-home-manager
- 日志目录: /opt/nfc-home-manager/logs/ 