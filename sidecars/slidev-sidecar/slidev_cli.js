#!/usr/bin/env node
const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Get arguments: slides.md file and output PDF path
const format = process.argv[2];
const slidesFile = process.argv[3];
const outputFile = process.argv[4];
console.log(`format: ${format}`);
console.log(`slidesFile: ${slidesFile}`);
console.log(`outputFile: ${outputFile}`);

if ((format === "pdf" || format === "png") && (!slidesFile || !outputFile)) {
  console.error('Usage: slidev-sidecar <format> <slides.md> <output.pdf>');
  console.error('Example: slidev-sidecar pdf ./slides.md ./output.pdf');
  console.error('Example: slidev-sidecar png ./slides.md ./output');
  process.exit(1);
}


// Validate slides file exists
if (!fs.existsSync(slidesFile)) {
  console.error(`❌ Error: Slides file not found: ${slidesFile}`);
  process.exit(1);
}

const absSlidesFile = path.resolve(slidesFile);
const absOutputFile = path.resolve(outputFile);

// Function to check if nvm is installed
function isNvmInstalled() {
  const nvmDir = path.join(os.homedir(), '.nvm');
  return fs.existsSync(path.join(nvmDir, 'nvm.sh'));
}

// Function to install nvm
function installNvm() {
  console.log('📦 Installing nvm...');
  try {
    execSync('curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash', {
      stdio: 'inherit',
      shell: '/bin/bash'
    });
    console.log('✅ nvm installed successfully');
  } catch (err) {
    console.error('❌ Failed to install nvm:', err.message);
    process.exit(1);
  }
}

// Function to check if Node.js v24 is installed via nvm
function isNode24Installed() {
  const nvmDir = path.join(os.homedir(), '.nvm');
  const node24Dir = path.join(nvmDir, 'versions', 'node');

  if (!fs.existsSync(node24Dir)) return false;

  const versions = fs.readdirSync(node24Dir);
  return versions.some(v => v.startsWith('v24.'));
}

// Function to install Node.js v24 via nvm
function installNode24() {
  console.log('📦 Installing Node.js v24 via nvm...');
  const nvmScript = path.join(os.homedir(), '.nvm', 'nvm.sh');

  try {
    execSync(`source "${nvmScript}" && nvm install 24`, {
      stdio: 'inherit',
      shell: '/bin/bash'
    });
    console.log('✅ Node.js v24 installed successfully');
  } catch (err) {
    console.error('❌ Failed to install Node.js v24:', err.message);
    process.exit(1);
  }
}

// Function to get Node.js v24 path from nvm
function getNode24Path() {
  const nvmDir = path.join(os.homedir(), '.nvm');
  const node24Dir = path.join(nvmDir, 'versions', 'node');

  const versions = fs.readdirSync(node24Dir);
  const v24 = versions.find(v => v.startsWith('v24.'));

  if (!v24) return null;

  return path.join(node24Dir, v24, 'bin', 'node');
}

// Function to check if @slidev/cli is installed globally with Node.js v24
function isSlidevInstalled(npmPath) {
  try {
    const output = execSync(`"${npmPath}" list -g @slidev/cli --depth=0`, {
      encoding: 'utf8',
      stdio: 'pipe',
      shell: '/bin/bash'
    });
    return output.includes('@slidev/cli');
  } catch (err) {
    return false;
  }
}
function isPlaywrightInstalled(npmPath) {
  try {
    const output = execSync(`"${npmPath}" list playwright --depth=0`, {
      encoding: 'utf8',
      stdio: 'pipe',
      shell: '/bin/bash'
    });
    return output.includes('playwright');
  } catch (err) {
    return false;
  }
}

// Function to install @slidev/cli and dependencies globally
function installSlidev(npmPath, nodePath) {
  console.log('📦 Installing @slidev/cli and dependencies globally...');
  try {
    // Get the nvm node version directory to use as npm prefix
    const nodeDir = path.dirname(path.dirname(nodePath));

    // Configure npm prefix to avoid permission features
    execSync(`"${npmPath}" config set prefix "${nodeDir}"`, {
      stdio: 'pipe',
      shell: '/bin/bash'
    });

    execSync(`"${npmPath}" install -g @slidev/cli @slidev/theme-default playwright-chromium`, {
      stdio: 'inherit',
      shell: '/bin/bash'
    });
    console.log('✅ Slidev installed successfully');
  } catch (err) {
    console.error('❌ Failed to install Slidev:', err.message);
    process.exit(1);
  }
}
function installPlayWright(npmPath) {
  console.log('📦 Installing Playwright ...');
  try {
    execSync(`"${npmPath}" install -g playwright-chromium`, {
      stdio: 'inherit',
      shell: '/bin/bash'
    });
    console.log('✅ Playwright installed successfully');
  } catch (err) {
    console.error('❌ Failed to install Playwright:', err.message);
    process.exit(1);
  }
}


console.log('📦 Slidev Sidecar - Checking Node.js setup...');

// Step 1: Ensure nvm is installed
if (!isNvmInstalled()) {
  console.log('⚠️  nvm not found, installing...');
  installNvm();
}

// Step 2: Ensure Node.js v24 is installed
if (!isNode24Installed()) {
  console.log('⚠️  Node.js v24 not found, installing...');
  installNode24();
}

// Step 3: Get Node.js v24 path
const nodePath = getNode24Path();
if (!nodePath) {
  console.error('❌ Failed to locate Node.js v24');
  process.exit(1);
}

console.log('✅ Node.js v24 ready at:', nodePath);

// Step 4: Get npm and npx paths (same directory as node)
const npmPath = path.join(path.dirname(nodePath), 'npm');
const npxPath = path.join(path.dirname(nodePath), 'npx');

// Step 5: Ensure @slidev/cli is installed globally
if (!isSlidevInstalled(npmPath)) {
  console.log('⚠️  @slidev/cli not found globally, installing...');
  installSlidev(npmPath, nodePath);
}
if (!isPlaywrightInstalled(npmPath)) {
  console.log('⚠️  Playwright not found, installing...');
  installPlayWright(npmPath);
}

console.log('✅ @slidev/cli is ready');
console.log('✅ Playwright is ready');

console.log('\n📦 Starting Slidev export...');
console.log(`   Input:  ${absSlidesFile}`);
console.log(`   Output: ${absOutputFile}`);

// Step 6: Execute npx slidev export with auto-installed Node.js v24
// Use slides file's directory as working directory for proper asset resolution
const slidesDir = path.dirname(absSlidesFile);

const formatedArr = format == "png" ? ['slidev', 'export',"--format png", absSlidesFile] : ['slidev', 'export', absSlidesFile,  '--output', absOutputFile];
const result = spawnSync(
  npxPath,
  formatedArr,
  {
    stdio: 'inherit',
    cwd: slidesDir
  }
);
/* Normally, when we want to export a slide as a PNG, we put it in the slides export folder. We need to extract it from there and put it in the output path. */
if (result.error) {
  console.error('❌ Export failed:', result.error.message);
  process.exit(1);
}

if (result.status !== 0) {
  console.error(`❌ Export failed with exit code ${result.status}`);
  process.exit(result.status);
}

// ✅ Handle PNG export directory move
if (format === "png") {
  const exportDir = path.join(slidesDir, 'export');

  if (!fs.existsSync(exportDir)) {
    console.error('❌ PNG export folder not found:', exportDir);
    process.exit(1);
  }

  // Ensure output directory exists
  if (!fs.existsSync(absOutputFile)) {
    fs.mkdirSync(absOutputFile, { recursive: true });
  }

  // Move all PNG files from exportDir to output path
  const files = fs.readdirSync(exportDir).filter(f => f.endsWith('.png'));
  for (const file of files) {
    const src = path.join(exportDir, file);
    const dest = path.join(absOutputFile, file);
    fs.renameSync(src, dest);
  }

  console.log(`✅ PNG files moved to: ${absOutputFile}`);

  // Optional: clean up the temporary export directory
  try {
    fs.rmSync(exportDir, { recursive: true, force: true });
    console.log('🧹 Cleaned up temporary export folder.');
  } catch (err) {
    console.warn('⚠️ Could not remove export folder:', err.message);
  }
}

console.log('\n✅ Export completed successfully!');
