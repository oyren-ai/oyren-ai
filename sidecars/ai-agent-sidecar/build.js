const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function checkDenoInstalled() {
  try {
    execSync('deno --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

if (!checkDenoInstalled()) {
  console.error('❌ Deno is not installed or not in PATH!');
  console.error('');
  console.error('Install Deno: https://docs.deno.com/runtime/getting_started/installation/');
  process.exit(1);
}

// Tauri v2 sets TAURI_ENV_TARGET_TRIPLE during beforeBuildCommand
const targetTriple = process.env.TAURI_ENV_TARGET_TRIPLE || null;
const isWindows = targetTriple ? targetTriple.includes('windows') : process.platform === 'win32';
const ext = isWindows ? '.exe' : '';
const targetFlag = targetTriple ? `--target ${targetTriple}` : '';

console.log(`🔨 Compiling Deno agent${targetTriple ? ` for ${targetTriple}` : ''}...`);
try {
  execSync(`deno compile --allow-all ${targetFlag} --output oyren-ai-agent-sidecar${ext} src/index.ts`, {
    stdio: 'inherit',
    cwd: __dirname
  });
} catch (error) {
  console.error('❌ Deno compilation failed!');
  process.exit(1);
}

console.log('📝 Renaming binary...');
try {
  execSync('node rename.js', {
    stdio: 'inherit',
    cwd: __dirname
  });
} catch (error) {
  console.error('❌ Rename script failed!');
  process.exit(1);
}

console.log('✅ Build complete! Restart the app!');
