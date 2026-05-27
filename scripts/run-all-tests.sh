#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo -e "${BLUE}${BOLD}===========================================
🧪 Running All Tests (JavaScript/TypeScript + Rust)
===========================================${NC}\n"

# Track if any tests fail
TESTS_FAILED=0

# Run JavaScript/TypeScript tests with coverage
echo -e "${YELLOW}📊 Running JavaScript/TypeScript tests with coverage...${NC}"
pnpm test:coverage
JS_TEST_STATUS=$?

if [ $JS_TEST_STATUS -eq 0 ]; then
    echo -e "${GREEN}✅ JavaScript/TypeScript tests passed!${NC}\n"
else
    echo -e "${RED}❌ JavaScript/TypeScript tests failed!${NC}\n"
    TESTS_FAILED=1
fi

# Run Rust tests
echo -e "${YELLOW}🦀 Running Rust tests...${NC}"
cd src-tauri

# Run tests with output
cargo test --verbose
RUST_TEST_STATUS=$?

if [ $RUST_TEST_STATUS -eq 0 ]; then
    echo -e "${GREEN}✅ Rust tests passed!${NC}\n"
else
    echo -e "${RED}❌ Rust tests failed!${NC}\n"
    TESTS_FAILED=1
fi

# Go back to desktop directory
cd ..

# Summary
echo -e "${BLUE}${BOLD}===========================================
📋 Test Summary
===========================================${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✅ All tests passed successfully!${NC}"
    echo -e "${BLUE}📊 Coverage report available at: coverage/index.html${NC}"
    exit 0
else
    echo -e "${RED}${BOLD}❌ Some tests failed. Please check the errors above.${NC}"
    exit 1
fi