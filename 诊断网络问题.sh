#!/bin/bash

echo "🔍 NFC家庭管理系统 - 网络访问诊断"
echo "============================================"

echo ""
echo "📋 1. 检查应用运行状态:"
pm2 status

echo ""
echo "📋 2. 检查端口监听状态:"
echo "检查80端口:"
lsof -i :80 2>/dev/null || echo "80端口未监听"
echo "检查3000端口:"  
lsof -i :3000 2>/dev/null || echo "3000端口未监听"

echo ""
echo "📋 3. 检查防火墙状态:"
firewall-cmd --list-ports 2>/dev/null || echo "防火墙命令失败"

echo ""
echo "📋 4. 测试本地访问:"
echo "测试localhost:80..."
curl -s -I http://localhost:80 | head -1 2>/dev/null || echo "本地80端口访问失败"
echo "测试localhost:3000..."
curl -s -I http://localhost:3000 | head -1 2>/dev/null || echo "本地3000端口访问失败"

echo ""
echo "📋 5. 检查进程:"
ps aux | grep node | grep -v grep

echo ""
echo "📋 6. 应用日志 (最后10行):"
pm2 logs --lines 10 2>/dev/null || echo "无法获取PM2日志"

echo ""
echo "============================================"
echo "🔧 解决方案建议:"
echo ""
echo "1. 如果应用未运行在80端口，执行:"
echo "   bash /opt/nfc-home-manager/start-port80.sh"
echo ""
echo "2. 检查云服务器安全组是否开放了80端口"
echo ""  
echo "3. 如果是腾讯云，检查控制台 > 安全组 > 入站规则"
echo "   确保80端口和3000端口都已开放"
echo ""
echo "4. 访问地址:"
echo "   - http://101.35.16.205 (80端口)"
echo "   - http://101.35.16.205:3000 (3000端口)" 
echo ""
echo "============================================" 