#!/bin/bash
set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Oyren AI - Interactive Build Script       ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

# Detect current platform
CURRENT_OS=$(uname -s)
case $CURRENT_OS in
    Darwin)
        PLATFORM_NAME="macOS"
        NATIVE_BUNDLE="dmg"
        ;;
    Linux)
        PLATFORM_NAME="Linux"
        NATIVE_BUNDLE="appimage"
        ;;
    MINGW*|MSYS*|CYGWIN*)
        PLATFORM_NAME="Windows"
        NATIVE_BUNDLE="msi"
        ;;
    *)
        PLATFORM_NAME="Unknown"
        NATIVE_BUNDLE="app"
        ;;
esac

echo -e "${BLUE}Current Platform: ${PLATFORM_NAME}${NC}"
echo -e "${YELLOW}Note: Tauri can only build for the current platform unless using CI/CD${NC}"
echo ""

# Function to build for current platform
build_current_platform() {
    echo -e "${YELLOW}🔨 Building Tauri App (includes AI agent sidecar)...${NC}"
    echo -e "${BLUE}The build will automatically:${NC}"
    echo -e "${BLUE}  1. Build AI agent sidecar${NC}"
    echo -e "${BLUE}  2. Build frontend${NC}"
    echo -e "${BLUE}  3. Build Tauri app${NC}"
    echo ""

    pnpm run tauri build

    echo -e "${GREEN}✅ Build completed successfully!${NC}"
    echo -e "${BLUE}📦 Output: src-tauri/target/release/bundle/${NC}"
    echo ""
}

# Function to build with specific bundle type
build_with_bundle() {
    local bundle=$1
    echo -e "${YELLOW}🔨 Building Tauri App with ${bundle} bundle...${NC}"

    pnpm run tauri build -- -b ${bundle}

    echo -e "${GREEN}✅ ${bundle} build completed!${NC}"
    echo -e "${BLUE}📦 Output: src-tauri/target/release/bundle/${bundle}/${NC}"
    echo ""
}

# Main menu
echo -e "${YELLOW}Build Options:${NC}"
echo ""
echo "  1) Build for current platform (${PLATFORM_NAME}) - Default"
echo "  2) Build specific bundle (${NATIVE_BUNDLE})"
echo "  3) Build app bundle only"
echo "  4) Show cross-platform build instructions"
echo "  5) Cancel"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo -e "${GREEN}Building for ${PLATFORM_NAME}...${NC}"
        echo ""
        build_current_platform
        ;;
    2)
        echo ""
        echo -e "${GREEN}Building ${NATIVE_BUNDLE} bundle...${NC}"
        echo ""
        build_with_bundle "${NATIVE_BUNDLE}"
        ;;
    3)
        echo ""
        echo -e "${GREEN}Building app bundle...${NC}"
        echo ""
        build_with_bundle "app"
        ;;
    4)
        echo ""
        echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${BLUE}║          Cross-Platform Build Instructions                  ║${NC}"
        echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${YELLOW}Tauri doesn't support cross-compilation by default.${NC}"
        echo -e "${YELLOW}To build for different platforms, you have 3 options:${NC}"
        echo ""
        echo -e "${GREEN}Option 1: Build on Target Platform${NC}"
        echo "  - macOS: Build on a Mac"
        echo "  - Windows: Build on a Windows PC"
        echo "  - Linux: Build on a Linux machine"
        echo ""
        echo -e "${GREEN}Option 2: Use GitHub Actions (Recommended)${NC}"
        echo "  - Create .github/workflows/release.yml"
        echo "  - Use tauri-action to build for all platforms"
        echo "  - Example: https://github.com/tauri-apps/tauri-action"
        echo ""
        echo -e "${GREEN}Option 3: Use Virtual Machines${NC}"
        echo "  - macOS: Use a Mac or Hackintosh"
        echo "  - Windows: Use VirtualBox/VMware"
        echo "  - Linux: Use Docker or WSL"
        echo ""
        echo -e "${BLUE}For more info: https://tauri.app/distribute/building/${NC}"
        echo ""
        ;;
    5)
        echo ""
        echo -e "${YELLOW}Build cancelled.${NC}"
        exit 0
        ;;
    *)
        echo ""
        echo -e "${RED}Invalid choice. Please run the script again.${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Build Completed Successfully!       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"