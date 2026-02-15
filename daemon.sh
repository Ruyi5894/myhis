#!/bin/bash

# myhis-web 服务守护脚本
# 防止服务意外停止，自动重启

APP_DIR="/Users/ruyi/.openclaw/workspace/myhis-web"
LOG_FILE="/Users/ruyi/.openclaw/workspace/myhis-web/daemon.log"

check_and_start() {
    if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "[$(date)] 检测到服务已停止，重新启动..." >> $LOG_FILE
        
        # 杀死旧的进程
        pkill -f "npm run dev" 2>/dev/null
        sleep 2
        
        # 启动新进程
        cd $APP_DIR && HOST=0.0.0.0 npm run dev >> $LOG_FILE 2>&1 &
        
        echo "[$(date)] 服务已重启" >> $LOG_FILE
    else
        echo "[$(date)] 服务运行正常" >> $LOG_FILE
    fi
}

# 立即检查一次
check_and_start
