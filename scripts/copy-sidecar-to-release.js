// Copy sidecar binary to target/release directory
// This ensures the sidecar is available when running oyren.exe directly

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const targetTriple = process.env.TARGET || execSync('rustc -vV', { encoding: 'utf8' })
  .split('\n')
  .find(line => line.startsWith('host:'))
  ?.split(/\s+/)[1] || 'x86_64-pc-windows-msvc';

const sidecarName = `oyren-ai-agent-sidecar-${targetTriple}.exe`;
const source = path.join('src-tauri', 'binaries', sidecarName);
const dest = path.join('src-tauri', 'target', 'release', sidecarName);

if (fs.existsSync(source)) {
  const releaseDir = path.dirname(dest);
  if (!fs.existsSync(releaseDir)) {
    console.warn('Warning: target/release directory does not exist yet.');
    process.exit(0);
  }
  
  fs.copyFileSync(source, dest);
  console.log(`✓ Copied sidecar to: ${dest}`);
} else {
  console.warn(`Warning: Sidecar not found at: ${source}`);
  console.warn('Run "pnpm build:oyren-ai-agent-sidecar" first.');
}

