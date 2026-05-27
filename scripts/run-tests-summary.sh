#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'
DIM='\033[2m'

echo -e "${BLUE}${BOLD}╔═══════════════════════════════════════════════════════╗
║          🧪 Oyren Desktop Test Suite                  ║
╚═══════════════════════════════════════════════════════╝${NC}\n"

# Track if any tests fail
TESTS_FAILED=0
START_TIME=$(date +%s)

# Function to print section header
print_section() {
    echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Run JavaScript/TypeScript tests with coverage
print_section "📊 JavaScript/TypeScript Tests"

# Run tests with reporter that shows failures nicely
JS_OUTPUT=$(pnpm test:js 2>&1)
JS_TEST_STATUS=$?

# Extract test summary from output
if [ $JS_TEST_STATUS -eq 0 ]; then
    echo -e "${GREEN}✅ Status: PASSED${NC}"
    # Extract summary from successful run
    JS_SUMMARY=$(echo "$JS_OUTPUT" | grep -E "(Test Files|Tests|Duration)" | tail -3)
    echo -e "${DIM}$JS_SUMMARY${NC}"
    
    # Show coverage summary
    echo -e "\n${BOLD}Coverage Summary:${NC}"
    COVERAGE_SUMMARY=$(echo "$JS_OUTPUT" | grep "All files" | head -1)
    echo -e "${DIM}$COVERAGE_SUMMARY${NC}"
else
    echo -e "${RED}❌ Status: FAILED${NC}"
    
    # Extract failed test information
    echo -e "\n${RED}${BOLD}Failed Tests:${NC}"
    
    # Get list of failed tests with their error messages
    FAILED_TESTS=$(echo "$JS_OUTPUT" | grep -A 20 "Failed Tests" | sed -n '/FAIL/,/Test Files/p' | grep -v "Test Files")
    
    if [ -n "$FAILED_TESTS" ]; then
        echo "$FAILED_TESTS" | while IFS= read -r line; do
            if echo "$line" | grep -q "FAIL"; then
                echo -e "${RED}$line${NC}"
            elif echo "$line" | grep -q "AssertionError\|Error:"; then
                echo -e "${YELLOW}  $line${NC}"
            elif echo "$line" | grep -q "Expected\|Received"; then
                echo -e "${DIM}    $line${NC}"
            else
                echo -e "${DIM}  $line${NC}"
            fi
        done
    fi
    
    # Show test summary at the end
    JS_SUMMARY=$(echo "$JS_OUTPUT" | grep -E "(Test Files|Tests)" | tail -2)
    echo -e "\n${BOLD}Summary:${NC}"
    echo -e "${DIM}$JS_SUMMARY${NC}"
    
    TESTS_FAILED=1
fi

# Run Rust tests
print_section "🦀 Rust Tests"

cd src-tauri

# Run tests and capture output
RUST_OUTPUT=$(cargo test --no-fail-fast 2>&1)
RUST_TEST_STATUS=$?

# Extract test summary - count all test results across all test binaries
RUST_TOTAL_PASSED=$(echo "$RUST_OUTPUT" | grep -E "test result: ok" | grep -oE "[0-9]+ passed" | awk '{sum+=$1} END {print sum}')
RUST_TOTAL_FAILED=$(echo "$RUST_OUTPUT" | grep -E "test result:" | grep -oE "[0-9]+ failed" | awk '{sum+=$1} END {print sum}')

# Handle empty results
if [ -z "$RUST_TOTAL_PASSED" ]; then RUST_TOTAL_PASSED=0; fi
if [ -z "$RUST_TOTAL_FAILED" ]; then RUST_TOTAL_FAILED=0; fi

if [ $RUST_TEST_STATUS -eq 0 ]; then
    echo -e "${GREEN}✅ Status: PASSED${NC}"
    if [ $RUST_TOTAL_PASSED -gt 0 ]; then
        echo -e "${DIM}test result: ok. $RUST_TOTAL_PASSED passed; 0 failed${NC}"
    else
        echo -e "${DIM}No tests found${NC}"
    fi
else
    echo -e "${RED}❌ Status: FAILED${NC}"
    
    # Show failed tests
    echo -e "\n${RED}${BOLD}Failed Tests:${NC}"
    echo "$RUST_OUTPUT" | grep -B 2 -A 5 "FAILED" | while IFS= read -r line; do
        if echo "$line" | grep -q "FAILED"; then
            echo -e "${RED}$line${NC}"
        else
            echo -e "${DIM}  $line${NC}"
        fi
    done
    
    # Show summary
    echo -e "\n${BOLD}Summary:${NC}"
    echo -e "${DIM}test result: $RUST_TOTAL_PASSED passed; $RUST_TOTAL_FAILED failed${NC}"
    
    TESTS_FAILED=1
fi

cd ..

# Calculate elapsed time
END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

# Final Summary
echo -e "\n${BLUE}${BOLD}╔═══════════════════════════════════════════════════════╗
║                  📋 Final Report                      ║
╚═══════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BOLD}Test Suite Results:${NC}"
if [ $JS_TEST_STATUS -eq 0 ]; then
    echo -e "  • JavaScript/TypeScript: ${GREEN}✅ PASSED${NC}"
else
    echo -e "  • JavaScript/TypeScript: ${RED}❌ FAILED${NC}"
fi

if [ $RUST_TEST_STATUS -eq 0 ]; then
    echo -e "  • Rust:                  ${GREEN}✅ PASSED${NC} ($RUST_TOTAL_PASSED tests)"
else
    echo -e "  • Rust:                  ${RED}❌ FAILED${NC}"
fi

echo -e "\n${BOLD}Additional Information:${NC}"
echo -e "  • Total Duration: ${ELAPSED}s"
echo -e "  • Coverage Report: ${CYAN}coverage/index.html${NC}"
echo -e "  • Run with ${CYAN}pnpm test:coverage${NC} for detailed coverage"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}${BOLD}🎉 All tests passed successfully!${NC}\n"
    exit 0
else
    echo -e "\n${RED}${BOLD}⚠️  Some tests failed. Please review the errors above.${NC}\n"
    exit 1
fi