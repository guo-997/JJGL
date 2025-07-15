#!/bin/bash
echo "🚀 NFC家居管理系统 - 性能测试"
echo "================================"

# 测试页面加载时间
echo "测试页面加载时间..."
LOAD_TIME=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:3000)
echo "页面加载时间: ${LOAD_TIME}s"

# 测试API响应时间
echo "测试API响应时间..."
API_TIME=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:3000/api/dashboard/stats)
echo "API响应时间: ${API_TIME}s"

# 测试内存使用
echo "应用内存使用:"
pm2 status | grep nfc-home-manager

echo ""
echo "✅ 性能测试完成"
