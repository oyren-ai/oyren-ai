# Slidev Sidecar

A standalone executable that exports Slidev presentations (Markdown files) to PDF format with **automatic Node.js setup**.

## Purpose

This sidecar bundles Slidev and its dependencies into a single executable that can be shipped with the Tauri desktop application. On first run, it automatically installs Node.js v24 via nvm if not present, then uses it to convert Markdown presentation files to PDF.

## Requirements

### For End Users

**First run requires:**
- Internet connection (for auto-installing Node.js v24 via nvm)
- macOS, Linux, or Windows with bash shell

**After first run:**
- No internet needed (Node.js v24 is installed locally)
- Zero manual setup required

### For Developers Building the Sidecar

- **Node.js** (any version) to run the build
- **pnpm** package manager
- **@yao-pkg/pkg** (installed as dev dependency)

## Usage

### Basic Command

```bash
./ssidecar <input-slides.md> <output.pdf>
```

### Examples

```bash
# Export slides.md to output.pdf
./ssidecar ./slides.md ./output.pdf

# Export with absolute paths
./ssidecar /path/to/presentation.md /path/to/export.pdf
```

### First Run

On the first execution, the sidecar will:

1. ✅ Check if nvm is installed → install if missing
2. ✅ Check if Node.js v24 is installed → install if missing
3. ✅ Run Slidev export with the correct Node.js version

**Example first run output:**
```
📦 Slidev Sidecar - Checking Node.js setup...
⚠️  nvm not found, installing...
📦 Installing nvm...
✅ nvm installed successfully
⚠️  Node.js v24 not found, installing...
📦 Installing Node.js v24 via nvm...
✅ Node.js v24 installed successfully
✅ Node.js v24 ready at: /Users/username/.nvm/versions/node/v24.11.0/bin/node

📦 Starting Slidev export...
   Input:  /path/to/slides.md
   Output: /path/to/output.pdf

  ●■▲ Slidev v52.8.0
  ✓ exported to ./output.pdf

✅ Export completed successfully!
```

**Subsequent runs:**
```
📦 Slidev Sidecar - Checking Node.js setup...
✅ Node.js v24 ready at: /Users/username/.nvm/versions/node/v24.11.0/bin/node

📦 Starting Slidev export...
  ✓ exported to ./output.pdf

✅ Export completed successfully!
```

### Input File Format

The input must be a valid Slidev Markdown file:

```markdown
---
theme: default
---

# Slide 1

Content here

---

# Slide 2

More content
```

## Building

### Prerequisites

1. Install dependencies:
```bash
pnpm install
```

### Build Commands

```bash
# Build the sidecar binary
pnpm build

# The binary will be created as ./ssidecar
```

The build process uses `@yao-pkg/pkg` to bundle:
- Entry script (`hello.js`)
- Slidev dependencies (`node_modules`)
- Creates platform-specific executable (auto-detected)

**Build output:**
- macOS ARM64: `node20-macos-arm64`
- macOS x64: `node20-macos-x64`
- Linux x64: `node20-linux-x64`
- Windows x64: `node20-win-x64`

## Testing

### Test the Script Directly

```bash
# With Node.js installed
node hello.js ./slides.md ./test-output.pdf
```

### Test the Binary

```bash
# Build first
pnpm build

# Run the binary
./ssidecar ./slides.md ./binary-test.pdf
```

## Architecture

```
┌─────────────────────────────────────┐
│   Tauri App (Rust + TypeScript)     │
└────────────┬────────────────────────┘
             │ spawns sidecar
             ▼
┌─────────────────────────────────────┐
│   Slidev Sidecar Binary (pkg)       │
│   - hello.js (entry point)          │
│   - node_modules/@slidev/cli        │
│   - Auto-install logic              │
└────────────┬────────────────────────┘
             │
             │ checks/installs
             ▼
┌─────────────────────────────────────┐
│   nvm + Node.js v24                 │
│   Installed at: ~/.nvm/versions/... │
└────────────┬────────────────────────┘
             │
             │ executes
             ▼
┌─────────────────────────────────────┐
│   npx slidev export                 │
│   - Reads Markdown file             │
│   - Renders presentation            │
│   - Exports to PDF                  │
└─────────────────────────────────────┘
```

## How It Works

1. **User runs binary**: `./ssidecar slides.md output.pdf`

2. **Auto-install check**:
   - Checks `~/.nvm/nvm.sh` exists
   - If not: Downloads and installs nvm from GitHub
   - Checks `~/.nvm/versions/node/v24.x.x` exists
   - If not: Runs `nvm install 24`

3. **Execution**:
   - Locates Node.js v24 binary: `~/.nvm/versions/node/v24.11.0/bin/node`
   - Locates npx: `~/.nvm/versions/node/v24.11.0/bin/npx`
   - Runs: `npx slidev export <input> --output <output>`

4. **Result**:
   - PDF generated at specified output path
   - Uses bundled Slidev from sidecar's `node_modules`

## Files

- `hello.js` - Main entry point with auto-install logic
- `slides.md` - Sample presentation for testing
- `package.json` - Dependencies and build configuration
- `README.md` - This file

## Integration with Tauri

After building, copy the binary to the Tauri binaries directory:

```bash
# Manual copy
cp ssidecar ../../src-tauri/binaries/slidev-sidecar-aarch64-apple-darwin

# Or use rename script (if available)
node rename.js
```

The Tauri app can then spawn the sidecar:

```rust
use tauri_plugin_shell::ShellExt;

let output = app
    .shell()
    .sidecar("slidev-sidecar")
    .args(["path/to/slides.md", "path/to/output.pdf"])
    .output()
    .await?;
```

## Dependencies

### Runtime Dependencies (bundled in binary)
- **@slidev/cli** (v52.8.0) - Slidev presentation framework
- **@slidev/theme-default** - Default theme
- **playwright-chromium** - Headless browser for PDF export

### Dev Dependencies
- **@yao-pkg/pkg** (v5.16.1) - Packaging tool to create standalone executable

### Auto-installed Dependencies (managed by sidecar)
- **nvm** (v0.40.3) - Node Version Manager
- **Node.js** (v24.11.0) - JavaScript runtime

## Troubleshooting

### First run fails with network error

**Issue**: Cannot download nvm or Node.js

**Solution**: Ensure internet connection is available

### "Failed to install nvm"

**Issue**: curl or bash not available

**Solution**: Ensure curl and bash are installed:
```bash
# macOS
brew install curl

# Linux
sudo apt-get install curl
```

### Node.js v24 installed but not detected

**Issue**: nvm directory structure unexpected

**Solution**: Check `~/.nvm/versions/node/` for v24.x.x folder:
```bash
ls ~/.nvm/versions/node/
```

### Binary won't execute on macOS

**Issue**: Binary is quarantined by Gatekeeper

**Solution**: Remove quarantine attribute:
```bash
xattr -d com.apple.quarantine ./ssidecar
```

### Slidev export fails

**Issue**: Playwright chromium not installed

**Solution**: The auto-installed Node.js v24 includes npm. Run:
```bash
~/.nvm/versions/node/v24.11.0/bin/npx playwright install chromium
```

### Want to use different Node.js version

**Issue**: Need Node.js v22 or v20 instead of v24

**Solution**: Modify `hello.js` line 54-55:
```javascript
// Change from:
return versions.some(v => v.startsWith('v24.'));

// To (for example, Node.js v22):
return versions.some(v => v.startsWith('v22.'));
```

Then update the install function similarly and rebuild.

## System Requirements

### Supported Platforms

- ✅ macOS (ARM64, x64)
- ✅ Linux (x64, ARM64)
- ✅ Windows (via WSL or Git Bash)

### Disk Space

- Initial binary: ~300MB (includes node_modules)
- After first run: +112MB (Node.js v24)
- Total: ~412MB

### Network

- First run: Downloads ~50MB (nvm installer + Node.js v24)
- Subsequent runs: No network needed

## Performance

- **First run**: 30-60 seconds (includes Node.js download)
- **Subsequent runs**: 5-15 seconds (PDF generation only)
- **Binary startup**: <1 second

## License

Part of the Oyren AI project.
