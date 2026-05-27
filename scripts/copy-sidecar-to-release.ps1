# Copy sidecar binary to target/release directory
# This ensures the sidecar is available when running oyren.exe directly

$targetTriple = "x86_64-pc-windows-msvc"
$sidecarName = "oyren-ai-agent-sidecar-$targetTriple.exe"
$source = "src-tauri\binaries\$sidecarName"
$dest = "src-tauri\target\release\$sidecarName"

if (Test-Path $source) {
    if (-not (Test-Path "src-tauri\target\release")) {
        Write-Host "Warning: target/release directory does not exist yet. Run 'cargo build --release' first." -ForegroundColor Yellow
        exit 0
    }
    
    Copy-Item -Path $source -Destination $dest -Force
    Write-Host "✓ Copied sidecar to: $dest" -ForegroundColor Green
} else {
    Write-Host "Warning: Sidecar not found at: $source" -ForegroundColor Yellow
    Write-Host "Run 'pnpm build:oyren-ai-agent-sidecar' first." -ForegroundColor Yellow
}

