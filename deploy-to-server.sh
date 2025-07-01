#!/bin/bash

# 服务器部署脚本 - 在本地执行
# 将自动连接到服务器并部署应用

SERVER_IP="101.35.16.205"
SERVER_USER="root"
SERVER_PASS="Guo@112233"

echo "🚀 开始部署NFC家庭物品管理系统到服务器..."

# 创建expect脚本来自动输入密码
cat > deploy-expect.exp << 'EOF'
#!/usr/bin/expect -f
set timeout -1
set server_ip [lindex $argv 0]
set server_user [lindex $argv 1]
set server_pass [lindex $argv 2]

spawn ssh $server_user@$server_ip

expect {
    "yes/no" {
        send "yes\r"
        expect "password:"
        send "$server_pass\r"
    }
    "password:" {
        send "$server_pass\r"
    }
}

expect "# "

# 下载并执行部署脚本
send "cd /tmp\r"
expect "# "

send "wget https://raw.githubusercontent.com/guo-997/JJGL/main/deploy/deploy-mysql.sh\r"
expect "# "

send "chmod +x deploy-mysql.sh\r"
expect "# "

send "./deploy-mysql.sh\r"
expect "# "

send "exit\r"
expect eof
EOF

# 如果系统有expect，使用expect脚本
if command -v expect &> /dev/null; then
    chmod +x deploy-expect.exp
    expect deploy-expect.exp $SERVER_IP $SERVER_USER $SERVER_PASS
    rm -f deploy-expect.exp
else
    echo "⚠️ 系统未安装expect，请手动执行以下步骤："
    echo ""
    echo "1. 连接到服务器："
    echo "   ssh root@101.35.16.205"
    echo "   密码: Guo@112233"
    echo ""
    echo "2. 在服务器上执行："
    echo "   cd /tmp"
    echo "   wget https://raw.githubusercontent.com/guo-997/JJGL/main/deploy/deploy-mysql.sh"
    echo "   chmod +x deploy-mysql.sh"
    echo "   ./deploy-mysql.sh"
fi 