#!/bin/bash
# Start API server and Unify frontend.
# If the ports are already bound (e.g. by artifact workflows), skip starting
# those services — the proxy will already be serving them.

api_running() { lsof -ti:8080 > /dev/null 2>&1; }
ui_running()  { lsof -ti:18662 > /dev/null 2>&1; }

if ! api_running; then
  PORT=8080 pnpm --filter @workspace/api-server run dev &
fi

if ! ui_running; then
  PORT=18662 BASE_PATH=/ pnpm --filter @workspace/unify run dev &
fi

# Wait for the UI port to be available (required by Replit's waitForPort check).
until ui_running; do sleep 1; done

# Keep the script alive so the workflow stays running.
wait
