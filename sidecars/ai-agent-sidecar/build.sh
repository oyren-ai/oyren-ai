#!/bin/bash
set -e  # Exit on error

echo "🔨 Compiling Oyren AI Agent Sidecar..."
deno compile --allow-all --output oyren-ai-agent-sidecar src/index.ts

echo "📝 Renaming binary..."
node rename.js

echo "✅ Build complete! Restart the app!"