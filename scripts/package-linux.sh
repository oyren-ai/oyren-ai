#!/bin/bash

# Linux Packaging Script for Oyren
# 
# This script helps package the Linux builds for different distributions.
# It can create AppImage, deb, and rpm packages.
#
# Usage: ./scripts/package-linux.sh [appimage|deb|rpm|all]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the package type from arguments
PACKAGE_TYPE=${1:-all}

# Paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR/.."
TARGET_DIR="$PROJECT_ROOT/src-tauri/target/release"
BUNDLE_DIR="$TARGET_DIR/bundle"

echo -e "${BLUE}📦 Oyren Linux Packaging Script${NC}"
echo -e "${BLUE}================================${NC}"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to package AppImage
package_appimage() {
    echo -e "\n${YELLOW}📦 Creating AppImage...${NC}"
    
t    if [ -f "$BUNDLE_DIR/appimage/oyren_0.0.3_amd64.AppImage" ]; then
        echo -e "${GREEN}✅ AppImage already exists${NC}"
        return
    fi
    
    # AppImage is created by Tauri automatically
    echo -e "${BLUE}Running Tauri build for AppImage...${NC}"
    cd "$PROJECT_ROOT"
    pnpm tauri build -- --bundles appimage
    
    if [ -f "$BUNDLE_DIR/appimage/oyren_0.0.3_amd64.AppImage" ]; then
        echo -e "${GREEN}✅ AppImage created successfully${NC}"
        echo -e "${BLUE}   Location: $BUNDLE_DIR/appimage/oyren_0.0.3_amd64.AppImage${NC}"
    else
        echo -e "${RED}❌ AppImage creation failed${NC}"
        exit 1
    fi
}

# Function to package deb
package_deb() {
    echo -e "\n${YELLOW}📦 Creating deb package...${NC}"
    
    if [ -f "$BUNDLE_DIR/deb/oyren_0.0.3_amd64.deb" ]; then
        echo -e "${GREEN}✅ deb package already exists${NC}"
        return
    fi
    
    # Check for dpkg-deb
    if ! command_exists dpkg-deb; then
        echo -e "${RED}❌ dpkg-deb not found. Please install dpkg.${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}Running Tauri build for deb...${NC}"
    cd "$PROJECT_ROOT"
    pnpm tauri build -- --bundles deb
    
    if [ -f "$BUNDLE_DIR/deb/oyren_0.0.3_amd64.deb" ]; then
        echo -e "${GREEN}✅ deb package created successfully${NC}"
        echo -e "${BLUE}   Location: $BUNDLE_DIR/deb/oyren_0.0.3_amd64.deb${NC}"
        
        # Show package info
        echo -e "\n${YELLOW}📋 Package information:${NC}"
        dpkg-deb --info "$BUNDLE_DIR/deb/oyren_0.0.3_amd64.deb"
    else
        echo -e "${RED}❌ deb package creation failed${NC}"
        exit 1
    fi
}

# Function to package rpm
package_rpm() {
    echo -e "\n${YELLOW}📦 Creating rpm package...${NC}"
    
    if [ -f "$BUNDLE_DIR/rpm/oyren-0.0.3-1.x86_64.rpm" ]; then
        echo -e "${GREEN}✅ rpm package already exists${NC}"
        return
    fi
    
    # Check for rpmbuild
    if ! command_exists rpmbuild; then
        echo -e "${RED}❌ rpmbuild not found. Please install rpm-build.${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}Running Tauri build for rpm...${NC}"
    cd "$PROJECT_ROOT"
    pnpm tauri build -- --bundles rpm
    
    if [ -f "$BUNDLE_DIR/rpm/oyren-0.0.3-1.x86_64.rpm" ]; then
        echo -e "${GREEN}✅ rpm package created successfully${NC}"
        echo -e "${BLUE}   Location: $BUNDLE_DIR/rpm/oyren-0.0.3-1.x86_64.rpm${NC}"
        
        # Show package info
        echo -e "\n${YELLOW}📋 Package information:${NC}"
        rpm -qip "$BUNDLE_DIR/rpm/oyren-0.0.3-1.x86_64.rpm"
    else
        echo -e "${RED}❌ rpm package creation failed${NC}"
        exit 1
    fi
}

# Function to create checksums
create_checksums() {
    echo -e "\n${YELLOW}🔐 Creating checksums...${NC}"
    
    CHECKSUM_FILE="$BUNDLE_DIR/oyren-linux-checksums.txt"
    > "$CHECKSUM_FILE"
    
    # Create checksums for all packages
    if [ -f "$BUNDLE_DIR/appimage/oyren_0.0.3_amd64.AppImage" ]; then
        echo -e "${BLUE}Creating checksum for AppImage...${NC}"
        cd "$BUNDLE_DIR/appimage"
        sha256sum oyren_0.0.3_amd64.AppImage >> "$CHECKSUM_FILE"
    fi
    
    if [ -f "$BUNDLE_DIR/deb/oyren_0.0.3_amd64.deb" ]; then
        echo -e "${BLUE}Creating checksum for deb...${NC}"
        cd "$BUNDLE_DIR/deb"
        sha256sum oyren_0.0.3_amd64.deb >> "$CHECKSUM_FILE"
    fi
    
    if [ -f "$BUNDLE_DIR/rpm/oyren-0.0.3-1.x86_64.rpm" ]; then
        echo -e "${BLUE}Creating checksum for rpm...${NC}"
        cd "$BUNDLE_DIR/rpm"
        sha256sum oyren-0.0.3-1.x86_64.rpm >> "$CHECKSUM_FILE"
    fi
    
    echo -e "${GREEN}✅ Checksums created: $CHECKSUM_FILE${NC}"
    cat "$CHECKSUM_FILE"
}

# Main execution
case $PACKAGE_TYPE in
    appimage)
        package_appimage
        ;;
    deb)
        package_deb
        ;;
    rpm)
        package_rpm
        ;;
    all)
        package_appimage
        package_deb
        package_rpm
        create_checksums
        ;;
    *)
        echo -e "${RED}❌ Invalid package type: $PACKAGE_TYPE${NC}"
        echo -e "${YELLOW}Usage: $0 [appimage|deb|rpm|all]${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}🎉 Linux packaging completed successfully!${NC}"
echo -e "${BLUE}📁 All packages are in: $BUNDLE_DIR${NC}"