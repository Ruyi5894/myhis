#!/bin/bash
if ! curl -s --max-time 5 http://localhost:3000 > /dev/null 2>&1; then
  echo "$(date): Service down, restarting..."
  cd /Users/ruyi/.openclaw/workspace/myhis-web
  pkill -f "npm run dev" 2>/dev/null
  sleep 2
  HOST=0.0.0.0 npm run dev &
else
  echo "$(date): Service is up"
fi
