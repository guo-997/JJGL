# 🚀 NFC家庭物品管理系统 - 快速部署指南

## 📋 服务器信息
- **IP地址**: 101.35.16.205
- **用户名**: root
- **密码**: Guo@112233
- **系统**: CentOS

## 🔧 部署步骤

### 1️⃣ 连接到服务器
```bash
ssh root@101.35.16.205
# 输入密码: Guo@112233
```

### 2️⃣ 下载并执行部署脚本
```bash
# 进入临时目录
cd /tmp

# 下载部署脚本
wget https://raw.githubusercontent.com/guo-997/JJGL/main/deploy/deploy-mysql.sh

# 添加执行权限
chmod +x deploy-mysql.sh

# 执行部署脚本
./deploy-mysql.sh
```

### 3️⃣ 等待部署完成
脚本将自动完成以下任务：
- ✅ 安装Node.js 18
- ✅ 安装MySQL客户端
- ✅ 安装Nginx
- ✅ 安装PM2进程管理器
- ✅ 克隆项目代码
- ✅ 安装项目依赖
- ✅ 创建MySQL数据库
- ✅ 配置Nginx反向代理
- ✅ 启动应用

## 🎉 部署完成后

### 访问应用
打开浏览器访问: **http://101.35.16.205**

### 常用命令
```bash
# 查看应用状态
pm2 status

# 查看应用日志
pm2 logs nfc-home-manager

# 重启应用
pm2 restart nfc-home-manager

# 查看实时日志
pm2 logs nfc-home-manager --lines 100 -f
```

### 故障排除
```bash
# 检查Nginx状态
systemctl status nginx

# 检查MySQL连接
mysql -h 101.35.16.205 -u nfc_user -pGuo@112233 -e "SHOW DATABASES;"

# 查看错误日志
tail -f /var/log/nginx/nfc-home-manager.error.log
```

## 📱 功能测试

1. **创建盒子**: 点击"新增盒子"按钮
2. **添加物品**: 进入盒子详情页添加物品
3. **NFC测试**: 使用支持NFC的手机测试扫描功能
4. **搜索功能**: 测试全局搜索

## ⚠️ 注意事项

- 确保服务器的80端口已开放
- MySQL已创建用户和数据库
- 文件上传目录权限已设置

---

**需要帮助？** 查看日志或联系技术支持。 