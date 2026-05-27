# PowerShell build script for Windows
$ErrorActionPreference = "Stop"

Write-Host "🔨 Compiling Deno agent..." -ForegroundColor Cyan
deno compile --allow-all --output ai-agent src/index.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deno compilation failed!" -ForegroundColor Red
    exit 1
}

Write-Host "📝 Renaming binary..." -ForegroundColor Cyan
node rename.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Rename script failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build complete! Restart the app!" -ForegroundColor Green

