# 🚀 NFC家庭物品管理系统 - 部署指南

本指南提供了在生产服务器上部署NFC家庭物品管理系统的完整说明。

## 📋 部署前准备

### 系统要求
- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **内存**: 最低2GB，推荐4GB+
- **存储**: 最低20GB可用空间
- **网络**: 公网IP或域名（可选）

### 服务器信息收集
在开始部署前，请准备以下信息：

```bash
# 服务器基本信息
服务器IP: ___________________
SSH用户名: __________________
SSH密码/密钥: _______________
域名（可选）: _______________

# 数据库信息（如果使用外部数据库）
数据库类型: MongoDB / MySQL
数据库地址: _________________
数据库端口: _________________
数据库名称: _________________
用户名: ____________________
密码: ______________________
```

## 🔧 部署方式选择

### 方式1: 自动化脚本部署（推荐）
适用于新服务器，一键安装所有依赖。

### 方式2: Docker容器化部署
适用于已有Docker环境的服务器。

### 方式3: 手动部署
适用于需要自定义配置的环境。

---

## 🚀 方式1: 自动化脚本部署

### 步骤1: 连接服务器
```bash
ssh root@your-server-ip
```

### 步骤2: 下载部署脚本
```bash
wget https://raw.githubusercontent.com/guo-997/JJGL/main/deploy/deploy.sh
chmod +x deploy.sh
```

### 步骤3: 运行部署脚本
```bash
./deploy.sh
```

### 步骤4: 配置环境变量
```bash
cd /var/www/nfc-home-manager
nano .env
```

编辑配置文件内容：
```env
# 服务器配置
PORT=3000
NODE_ENV=production
HOST=0.0.0.0

# 数据库配置
MONGODB_URI=mongodb://username:password@your-mongo-host:27017/nfc-home-manager

# 前端URL
FRONTEND_URL=https://your-domain.com

# 安全配置
JWT_SECRET=your-super-secret-jwt-key-in-production
```

### 步骤5: 重启应用
```bash
pm2 restart nfc-home-manager
```

### 步骤6: 验证部署
```bash
# 检查应用状态
pm2 status

# 检查应用日志
pm2 logs nfc-home-manager

# 检查Nginx状态
systemctl status nginx

# 访问健康检查接口
curl http://localhost/api/health
```

---

## 🐳 方式2: Docker容器化部署

### 步骤1: 安装Docker
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 步骤2: 克隆项目
```bash
git clone https://github.com/guo-997/JJGL.git
cd JJGL
```

### 步骤3: 配置环境变量
```bash
cp deploy/production.env .env
nano .env
```

### 步骤4: 启动服务
```bash
# 构建并启动所有服务
docker-compose -f deploy/docker-compose.yml up -d

# 查看服务状态
docker-compose -f deploy/docker-compose.yml ps

# 查看日志
docker-compose -f deploy/docker-compose.yml logs -f
```

### 步骤5: 验证部署
```bash
# 检查容器状态
docker ps

# 访问应用
curl http://localhost/api/health
```

---

## 🔧 方式3: 手动部署

### 步骤1: 安装Node.js
```bash
# 使用NodeSource仓库
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 步骤2: 安装MongoDB
```bash
# 导入公钥
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# 添加仓库
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# 安装MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# 启动服务
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 步骤3: 安装Nginx
```bash
sudo apt update
sudo apt install nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 步骤4: 克隆项目
```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/guo-997/JJGL.git nfc-home-manager
cd nfc-home-manager
```

### 步骤5: 安装依赖
```bash
sudo npm install --production
```

### 步骤6: 配置环境
```bash
sudo cp deploy/production.env .env
sudo nano .env
```

### 步骤7: 安装PM2
```bash
sudo npm install -g pm2
```

### 步骤8: 配置Nginx
```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/nfc-home-manager
sudo ln -s /etc/nginx/sites-available/nfc-home-manager /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 步骤9: 启动应用
```bash
sudo chown -R www-data:www-data /var/www/nfc-home-manager
cd /var/www/nfc-home-manager
sudo -u www-data pm2 start deploy/pm2.config.js --env production
sudo -u www-data pm2 save
sudo pm2 startup
```

---

## 🔍 部署后验证

### 基本检查
```bash
# 1. 检查端口监听
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :3000

# 2. 检查服务状态
systemctl status nginx
pm2 status

# 3. 检查日志
tail -f /var/log/nginx/nfc-home-manager.access.log
pm2 logs nfc-home-manager

# 4. 健康检查
curl http://localhost/api/health
curl http://your-domain.com/api/health
```

### 功能测试
1. **访问前端页面**: `http://your-domain.com`
2. **检查API接口**: `http://your-domain.com/api/dashboard/stats`
3. **测试文件上传**: 创建盒子并上传图片
4. **测试NFC功能**: 使用支持NFC的设备测试

---

## 🛡️ 安全配置

### 防火墙设置
```bash
# 允许HTTP和HTTPS
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22  # SSH

# 禁用其他端口
sudo ufw --force enable
```

### SSL证书配置（可选）
```bash
# 使用Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 系统加固
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 配置自动安全更新
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
```

---

## 📊 监控和维护

### 日常维护命令
```bash
# 查看应用状态
pm2 status
pm2 monit

# 重启应用
pm2 restart nfc-home-manager

# 查看日志
pm2 logs nfc-home-manager
tail -f /var/log/nginx/nfc-home-manager.error.log

# 清理日志
pm2 flush
sudo logrotate /etc/logrotate.conf

# 更新应用
cd /var/www/nfc-home-manager
git pull origin main
npm install --production
pm2 restart nfc-home-manager
```

### 备份策略
```bash
# 数据库备份
mongodump --uri="mongodb://localhost:27017/nfc-home-manager" --out=/backup/$(date +%Y%m%d)

# 文件备份
tar -czf /backup/uploads-$(date +%Y%m%d).tar.gz /var/www/nfc-home-manager/uploads
```

---

## 🆘 故障排除

### 常见问题

#### 1. 应用无法启动
```bash
# 检查端口占用
sudo lsof -i :3000

# 检查权限
ls -la /var/www/nfc-home-manager

# 检查环境变量
cat /var/www/nfc-home-manager/.env
```

#### 2. 数据库连接失败
```bash
# 检查MongoDB状态
sudo systemctl status mongod

# 检查连接
mongo --eval "db.stats()"

# 检查防火墙
sudo ufw status
```

#### 3. Nginx配置错误
```bash
# 测试配置
sudo nginx -t

# 重新加载
sudo systemctl reload nginx

# 检查错误日志
sudo tail -f /var/log/nginx/error.log
```

#### 4. 文件上传失败
```bash
# 检查目录权限
ls -la /var/www/nfc-home-manager/uploads

# 修复权限
sudo chown -R www-data:www-data /var/www/nfc-home-manager/uploads
sudo chmod -R 755 /var/www/nfc-home-manager/uploads
```

---

## 📞 技术支持

如果遇到部署问题，请提供以下信息：

1. **服务器信息**: 操作系统版本、配置
2. **错误日志**: PM2日志、Nginx日志、系统日志
3. **部署方式**: 使用的部署方法
4. **配置文件**: .env文件内容（隐藏敏感信息）

### 联系方式
- **GitHub Issues**: https://github.com/guo-997/JJGL/issues
- **部署脚本**: https://github.com/guo-997/JJGL/tree/main/deploy

---

## 🎉 部署完成

恭喜！你已经成功部署了NFC家庭物品管理系统。

**访问地址**: `http://your-domain.com` 或 `http://your-server-ip`

现在你可以：
1. 🏠 创建和管理储物盒
2. 📦 添加物品信息
3. 📱 使用NFC标签快速访问
4. 📊 查看统计数据
5. 🔍 搜索物品

享受你的智能家庭物品管理体验！ 