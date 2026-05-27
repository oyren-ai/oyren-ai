#!/bin/bash

# Get the target triple for the current platform
TARGET_TRIPLE=$(rustc -vV | grep host | cut -d' ' -f2)
EXT=""
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  EXT=".exe"
fi

BINARY_PATH="src-tauri/binaries/oyren-ai-agent-sidecar-${TARGET_TRIPLE}${EXT}"

# Check if the binary exists
if [ ! -f "$BINARY_PATH" ]; then
  echo "⚠️  Oyren AI agent sidecar not found, building..."
  cd sidecars/ai-agent-sidecar
  bash build.sh > /dev/null 2>&1
  cd ../..
  echo "✅ Oyren AI agent sidecar built successfully"
  echo ""
fi

# Run tauri:dev (all output goes directly to console)
pnpm tauri dev "$@"