# Windows Code Signing Script for Oyren
# 
# This script handles code signing for Windows builds.
# It requires the following:
# - Certificate file (.pfx) or certificate thumbprint
# - Certificate password (if using .pfx)
# - SignTool.exe (part of Windows SDK)
#
# Usage: .\scripts\sign-windows.ps1 -FilePath <exe-or-msi-path> [-CertPath <pfx-path>] [-CertPassword <password>] [-Thumbprint <thumbprint>]

param(
    [Parameter(Mandatory=$true)]
    [string]$FilePath,
    
    [Parameter(ParameterSetName='File')]
    [string]$CertPath,
    
    [Parameter(ParameterSetName='File')]
    [string]$CertPassword,
    
    [Parameter(ParameterSetName='Thumbprint')]
    [string]$Thumbprint,
    
    [string]$TimestampUrl = "http://timestamp.digicert.com"
)

# Check if SignTool is available
$signToolPath = Get-Command signtool.exe -ErrorAction SilentlyContinue
if (-not $signToolPath) {
    # Try to find SignTool in common SDK locations
    $possiblePaths = @(
        "${env:ProgramFiles(x86)}\Windows Kits\10\bin\x64\signtool.exe",
        "${env:ProgramFiles(x86)}\Windows Kits\10\bin\10.0.22621.0\x64\signtool.exe",
        "${env:ProgramFiles(x86)}\Windows Kits\10\bin\10.0.22000.0\x64\signtool.exe",
        "${env:ProgramFiles(x86)}\Windows Kits\10\bin\10.0.19041.0\x64\signtool.exe"
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $signToolPath = $path
            break
        }
    }
    
    if (-not $signToolPath) {
        Write-Error "❌ SignTool.exe not found. Please install Windows SDK."
        exit 1
    }
}

Write-Host "🔧 Using SignTool at: $signToolPath" -ForegroundColor Cyan

# Verify the file exists
if (-not (Test-Path $FilePath)) {
    Write-Error "❌ File not found: $FilePath"
    exit 1
}

Write-Host "📦 Signing file: $FilePath" -ForegroundColor Green

# Build the SignTool command based on parameters
$signArgs = @("sign")

if ($PSCmdlet.ParameterSetName -eq 'File') {
    # Using certificate file
    if (-not (Test-Path $CertPath)) {
        Write-Error "❌ Certificate file not found: $CertPath"
        exit 1
    }
    
    $signArgs += "/f", $CertPath
    
    if ($CertPassword) {
        $signArgs += "/p", $CertPassword
    }
} elseif ($PSCmdlet.ParameterSetName -eq 'Thumbprint') {
    # Using certificate from store
    $signArgs += "/sha1", $Thumbprint
}

# Add common parameters
$signArgs += @(
    "/tr", $TimestampUrl,
    "/td", "sha256",
    "/fd", "sha256",
    "/d", "Oyren - Academic IDE",
    "/du", "https://github.com/oyren-ai/oyren-ai-monorepo",
    $FilePath
)

# Execute signing
try {
    Write-Host "🖊️  Executing code signing..." -ForegroundColor Yellow
    & $signToolPath $signArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Code signing successful!" -ForegroundColor Green
        
        # Verify the signature
        Write-Host "🔍 Verifying signature..." -ForegroundColor Yellow
        & $signToolPath verify /pa $FilePath
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Signature verification successful!" -ForegroundColor Green
        } else {
            Write-Warning "⚠️  Signature verification failed"
        }
    } else {
        Write-Error "❌ Code signing failed with exit code: $LASTEXITCODE"
        exit 1
    }
} catch {
    Write-Error "❌ Error during signing: $_"
    exit 1
}

Write-Host "🎉 Windows code signing completed successfully!" -ForegroundColor Green