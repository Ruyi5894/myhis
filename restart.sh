#!/bin/bash
# myhis-web 一键重启脚本

cd "$(dirname "$0")"

echo "停止服务..."
pkill -f "next" 2>/dev/null
sleep 2

echo "启动服务..."
npm start
