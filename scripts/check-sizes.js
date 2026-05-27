import fs from 'fs';
import path from 'path';

const exePath = path.join('src-tauri', 'target', 'release', 'oyren.exe');
const sidecarPath = path.join('src-tauri', 'target', 'release', 'oyren-ai-agent-sidecar-x86_64-pc-windows-msvc.exe');

const formatSize = (bytes) => {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
};

console.log('📦 Windows Build Sizes:\n');

if (fs.existsSync(exePath)) {
  const exeSize = fs.statSync(exePath).size;
  console.log(`oyren.exe: ${formatSize(exeSize)}`);
}

if (fs.existsSync(sidecarPath)) {
  const sidecarSize = fs.statSync(sidecarPath).size;
  console.log(`sidecar: ${formatSize(sidecarSize)}`);
  
  if (fs.existsSync(exePath)) {
    const totalSize = fs.statSync(exePath).size + sidecarSize;
    console.log(`\nTotal (app + sidecar): ${formatSize(totalSize)}`);
  }
}

console.log('\n📝 Notes:');
console.log('- Windows: oyren.exe (~11 MB) + sidecar (~125 MB) = ~136 MB total');
console.log('- macOS: App bundle includes everything (~150 MB)');
console.log('- The sidecar is a Deno compiled binary with embedded node_modules (~125 MB)');
console.log('- This is normal - Deno binaries are large because they include the runtime');




