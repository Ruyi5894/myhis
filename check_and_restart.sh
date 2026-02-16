#!/bin/bash
# myhis-web 服务监控脚本
# 每5分钟检查一次，不响应则重启

LOG_FILE="/Users/ruyi/.openclaw/workspace/myhis-web/restart.log"

check_service() {
    curl -s --connect-timeout 5 --max-time 10 http://localhost:3000 > /dev/null 2>&1
    return $?
}

if ! check_service; then
    echo "[$(date)] ❌ 服务无响应，准备重启..." | tee -a "$LOG_FILE"
    
    # 停止现有进程
    cd /Users/ruyi/.openclaw/workspace/myhis-web
    pkill -f "npm run dev" 2>/dev/null
    sleep 2
    
    # 重新启动
    HOST=0.0.0.0 npm run dev > /dev/null 2>&1 &
    
    sleep 5
    
    if check_service; then
        echo "[$(date)] ✅ 服务已重启并恢复正常" | tee -a "$LOG_FILE"
    else
        echo "[$(date)] ⚠️ 重启后仍未响应，请检查日志" | tee -a "$LOG_FILE"
    fi
else
    echo "[$(date)] ✅ 服务正常运行" >> "$LOG_FILE"
fi
