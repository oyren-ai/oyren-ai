const { execSync } = require('child_process');
const fs = require('fs');


// TODO: for now we are omitting this but this code will work in windows
const ext = process.platform === 'win32' ? '.exe' : '';


const rustInfo = execSync('rustc -vV');
const targetTriple = /host: (\S+)/g.exec(rustInfo)[1];

// Ensure binaries directory exists
const binariesDir = '../../src-tauri/binaries';
if (!fs.existsSync(binariesDir)) {
  fs.mkdirSync(binariesDir, { recursive: true });
}

fs.renameSync(
  `slidev-sidecar${ext}`,
  `../../src-tauri/binaries/slidev-sidecar-${targetTriple}${ext}`
);

console.log(`✓ Renamed to: slidev-sidecar-${targetTriple}${ext}`);
