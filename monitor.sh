#!/bin/bash

# 检查 myhis-web 服务是否响应
if curl -s --connect-timeout 5 http://localhost:3000 > /dev/null 2>&1; then
    echo "$(date): 服务正常运行"
    exit 0
else
    echo "$(date): 服务无响应，准备重启..."
    
    # 进入项目目录并停止现有进程
    cd /Users/ruyi/.openclaw/workspace/myhis-web
    pkill -f "npm run dev" 2>/dev/null
    sleep 2
    
    # 重新启动服务
    HOST=0.0.0.0 npm run dev &
    
    echo "$(date): 服务已重启"
    exit 0
fi
