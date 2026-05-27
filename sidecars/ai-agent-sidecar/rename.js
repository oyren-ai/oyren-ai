const { execSync } = require('child_process');
const fs = require('fs');

// Use Tauri's target triple (set during beforeBuildCommand) or fall back to host
const targetTriple = process.env.TAURI_ENV_TARGET_TRIPLE || (() => {
  const rustInfo = execSync('rustc -vV');
  return /host: (\S+)/g.exec(rustInfo)[1];
})();

const isWindows = targetTriple.includes('windows');
const ext = isWindows ? '.exe' : '';

const binariesDir = '../../src-tauri/binaries';
if (!fs.existsSync(binariesDir)) {
  fs.mkdirSync(binariesDir, { recursive: true });
}

fs.renameSync(
  `oyren-ai-agent-sidecar${ext}`,
  `../../src-tauri/binaries/oyren-ai-agent-sidecar-${targetTriple}${ext}`
);

console.log(`✓ Renamed to: oyren-ai-agent-sidecar-${targetTriple}${ext}`);
