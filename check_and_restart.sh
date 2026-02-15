#!/bin/bash
# 简单的服务检查脚本
# 每5分钟运行一次

if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "[$(date)] 服务停止，重启中..."
    cd /Users/ruyi/.openclaw/workspace/myhis-web
    pkill -f "npm run dev" 2>/dev/null
    sleep 2
    HOST=0.0.0.0 npm run dev > /dev/null 2>&1 &
    echo "[$(date)] 已重启"
fi
