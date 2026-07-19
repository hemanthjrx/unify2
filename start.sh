#!/bin/bash
PORT=8080 pnpm --filter @workspace/api-server run dev &
PORT=18662 BASE_PATH=/ pnpm --filter @workspace/unify run dev
