#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color
BOLD='\033[1m'
DIM='\033[2m'

echo -e "${BLUE}${BOLD}╔═══════════════════════════════════════════════════════╗
║      📊 Oyren Desktop Test Coverage Report           ║
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

# Function to format coverage percentage with color
format_coverage() {
    local value=$1
    local threshold=80
    
    # Remove % sign if present
    value=${value%\%}
    
    # Handle non-numeric values
    if ! [[ "$value" =~ ^[0-9]+(\.[0-9]+)?$ ]]; then
        echo "${value}"
        return
    fi
    
    # Compare as integers
    if (( $(echo "$value >= $threshold" | bc -l) )); then
        echo -e "${GREEN}${value}%${NC}"
    elif (( $(echo "$value >= 60" | bc -l) )); then
        echo -e "${YELLOW}${value}%${NC}"
    else
        echo -e "${RED}${value}%${NC}"
    fi
}

# Run JavaScript/TypeScript tests with detailed coverage
print_section "📊 JavaScript/TypeScript Tests with Coverage"

# Run tests with coverage
echo -e "${DIM}Running tests with coverage analysis...${NC}\n"

# Run tests and save output to file for better parsing
TEMP_FILE=$(mktemp)
pnpm test:js:coverage > "$TEMP_FILE" 2>&1
JS_TEST_STATUS=$?

if [ $JS_TEST_STATUS -eq 0 ]; then
    echo -e "${GREEN}✅ Tests: PASSED${NC}\n"
    
    # Extract test summary
    echo -e "${BOLD}Test Summary:${NC}"
    grep -E "(Test Files|Tests|Duration)" "$TEMP_FILE" | tail -3 | while IFS= read -r line; do
        echo -e "${DIM}$line${NC}"
    done
    
    # Extract coverage summary
    echo -e "\n${BOLD}Coverage Summary:${NC}"
    echo -e "${DIM}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Look for the "All files" line which contains the summary
    ALL_FILES_LINE=$(grep "All files" "$TEMP_FILE" | head -1)
    
    if [ -n "$ALL_FILES_LINE" ]; then
        # Extract percentages from the All files line
        # The line format is typically: All files | stmts% | branch% | funcs% | lines% | ...
        STMTS=$(echo "$ALL_FILES_LINE" | awk -F'|' '{print $2}' | grep -oE "[0-9]+(\.[0-9]+)?" | head -1)
        BRANCH=$(echo "$ALL_FILES_LINE" | awk -F'|' '{print $3}' | grep -oE "[0-9]+(\.[0-9]+)?" | head -1)
        FUNCS=$(echo "$ALL_FILES_LINE" | awk -F'|' '{print $4}' | grep -oE "[0-9]+(\.[0-9]+)?" | head -1)
        LINES=$(echo "$ALL_FILES_LINE" | awk -F'|' '{print $5}' | grep -oE "[0-9]+(\.[0-9]+)?" | head -1)
        
        # Set default values if extraction failed
        STMTS=${STMTS:-"N/A"}
        BRANCH=${BRANCH:-"N/A"}
        FUNCS=${FUNCS:-"N/A"}
        LINES=${LINES:-"N/A"}
        
        # Display formatted coverage
        printf "  • Statements: %s\n" "$(format_coverage "$STMTS")"
        printf "  • Branches:   %s\n" "$(format_coverage "$BRANCH")"
        printf "  • Functions:  %s\n" "$(format_coverage "$FUNCS")"
        printf "  • Lines:      %s\n" "$(format_coverage "$LINES")"
    else
        # Try alternative format (Coverage summary)
        COVERAGE_SECTION=$(sed -n '/Coverage summary/,/^$/p' "$TEMP_FILE")
        
        if [ -n "$COVERAGE_SECTION" ]; then
            # Extract the percentages with more flexible regex
            STMTS=$(echo "$COVERAGE_SECTION" | grep -i "statements" | grep -oE "[0-9]+(\.[0-9]+)?%" | head -1 | tr -d '%')
            BRANCH=$(echo "$COVERAGE_SECTION" | grep -i "branches" | grep -oE "[0-9]+(\.[0-9]+)?%" | head -1 | tr -d '%')
            FUNCS=$(echo "$COVERAGE_SECTION" | grep -i "functions" | grep -oE "[0-9]+(\.[0-9]+)?%" | head -1 | tr -d '%')
            LINES=$(echo "$COVERAGE_SECTION" | grep -i "lines" | grep -oE "[0-9]+(\.[0-9]+)?%" | head -1 | tr -d '%')
            
            # Set default values if extraction failed
            STMTS=${STMTS:-"N/A"}
            BRANCH=${BRANCH:-"N/A"}
            FUNCS=${FUNCS:-"N/A"}
            LINES=${LINES:-"N/A"}
            
            # Display formatted coverage
            printf "  • Statements: %s\n" "$(format_coverage "$STMTS")"
            printf "  • Branches:   %s\n" "$(format_coverage "$BRANCH")"
            printf "  • Functions:  %s\n" "$(format_coverage "$FUNCS")"
            printf "  • Lines:      %s\n" "$(format_coverage "$LINES")"
        else
            echo -e "${YELLOW}Coverage data not found in expected format${NC}"
            echo -e "${DIM}Debug: Attempting to show raw coverage output...${NC}"
            grep -E "(Coverage|All files|%)" "$TEMP_FILE" | head -10
        fi
    fi
    
    # Show files with low coverage
    echo -e "\n${BOLD}Files with Coverage Below 80%:${NC}"
    echo -e "${DIM}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Use JSON coverage report if available for accurate file names
    if [ -f "coverage/coverage-final.json" ]; then
        # Parse JSON coverage report for files below 80%
        LOW_COV_FILES=$(node -e "
            const fs = require('fs');
            const coverage = JSON.parse(fs.readFileSync('coverage/coverage-final.json', 'utf8'));
            const basePath = process.cwd();
            
            const results = [];
            for (const [filePath, data] of Object.entries(coverage)) {
                // Skip non-source files
                if (!filePath.includes('/src/') || filePath.includes('node_modules') || 
                    filePath.includes('test.tsx') || filePath.includes('test.ts') ||
                    filePath.includes('.d.ts') || filePath.includes('vite.config') ||
                    filePath.includes('vitest.config')) {
                    continue;
                }
                
                const summary = data.s || {};
                const statements = Object.keys(summary).length;
                const covered = Object.values(summary).filter(v => v > 0).length;
                const percentage = statements > 0 ? (covered / statements * 100).toFixed(2) : 0;
                
                if (percentage < 80) {
                    // Get relative path for cleaner display
                    const relativePath = filePath.replace(basePath + '/', '');
                    results.push({ path: relativePath, percentage: parseFloat(percentage) });
                }
            }
            
            // Sort by percentage ascending
            results.sort((a, b) => a.percentage - b.percentage);
            
            // Output formatted results
            results.forEach(({ path, percentage }) => {
                console.log(\`  \${path.padEnd(80)} \${percentage.toFixed(2).padStart(6)}%\`);
            });
        " 2>/dev/null)
        
        if [ -n "$LOW_COV_FILES" ]; then
            echo "$LOW_COV_FILES"
            LOW_COV_COUNT=$(echo "$LOW_COV_FILES" | wc -l)
        else
            # Fallback to parsing text output if JSON parsing fails
            LOW_COV_FILES=$(grep -E "\.(ts|tsx|js|jsx)\s*\|" "$TEMP_FILE" | while IFS='|' read -r file stmts rest; do
                # Clean up whitespace
                file=$(echo "$file" | xargs)
                stmts=$(echo "$stmts" | xargs)
                
                # Skip if not a real file
                if [[ -z "$file" ]] || [[ "$file" =~ ^(File|--) ]]; then
                    continue
                fi
                
                # Extract percentage
                percentage=$(echo "$stmts" | grep -oE "^[0-9]+(\.[0-9]+)?" | head -1)
                
                # Check if percentage exists and is below 80
                if [[ -n "$percentage" ]] && (( $(echo "$percentage < 80" | bc -l) )); then
                    printf "  %-60s %6s%%\n" "$file" "$percentage"
                fi
            done | sort -t' ' -k2 -g)
            
            if [ -n "$LOW_COV_FILES" ]; then
                echo "$LOW_COV_FILES"
                LOW_COV_COUNT=$(echo "$LOW_COV_FILES" | wc -l)
            else
                echo -e "${GREEN}  All individual files meet the 80% coverage threshold!${NC}"
                LOW_COV_COUNT=0
            fi
        fi
    else
        # Original text-based parsing as fallback
        LOW_COV_FILES=$(grep -E "\.(ts|tsx|js|jsx)\s*\|" "$TEMP_FILE" | while IFS='|' read -r file stmts rest; do
            # Clean up whitespace
            file=$(echo "$file" | xargs)
            stmts=$(echo "$stmts" | xargs)
            
            # Skip if not a real file
            if [[ -z "$file" ]] || [[ "$file" =~ ^(File|--) ]]; then
                continue
            fi
            
            # Extract percentage
            percentage=$(echo "$stmts" | grep -oE "^[0-9]+(\.[0-9]+)?" | head -1)
            
            # Check if percentage exists and is below 80
            if [[ -n "$percentage" ]] && (( $(echo "$percentage < 80" | bc -l) )); then
                printf "  %-60s %6s%%\n" "$file" "$percentage"
            fi
        done | sort -t' ' -k2 -g)
        
        if [ -n "$LOW_COV_FILES" ]; then
            echo "$LOW_COV_FILES"
            LOW_COV_COUNT=$(echo "$LOW_COV_FILES" | wc -l)
        else
            echo -e "${GREEN}  All individual files meet the 80% coverage threshold!${NC}"
            LOW_COV_COUNT=0
        fi
    fi
    
    # Check overall coverage against threshold
    echo -e "\n${BOLD}Overall Coverage Assessment:${NC}"
    THRESHOLD=80
    OVERALL_PASS=1
    
    if [ -n "$STMTS" ] && [ "$STMTS" != "N/A" ]; then
        if (( $(echo "$STMTS < $THRESHOLD" | bc -l) )); then
            echo -e "  ${RED}❌ Statements: $STMTS% (below $THRESHOLD% threshold)${NC}"
            OVERALL_PASS=0
        else
            echo -e "  ${GREEN}✅ Statements: $STMTS% (meets threshold)${NC}"
        fi
    fi
    
    if [ -n "$BRANCH" ] && [ "$BRANCH" != "N/A" ]; then
        if (( $(echo "$BRANCH < $THRESHOLD" | bc -l) )); then
            echo -e "  ${RED}❌ Branches: $BRANCH% (below $THRESHOLD% threshold)${NC}"
            OVERALL_PASS=0
        else
            echo -e "  ${GREEN}✅ Branches: $BRANCH% (meets threshold)${NC}"
        fi
    fi
    
    if [ -n "$FUNCS" ] && [ "$FUNCS" != "N/A" ]; then
        if (( $(echo "$FUNCS < $THRESHOLD" | bc -l) )); then
            echo -e "  ${RED}❌ Functions: $FUNCS% (below $THRESHOLD% threshold)${NC}"
            OVERALL_PASS=0
        else
            echo -e "  ${GREEN}✅ Functions: $FUNCS% (meets threshold)${NC}"
        fi
    fi
    
    if [ -n "$LINES" ] && [ "$LINES" != "N/A" ]; then
        if (( $(echo "$LINES < $THRESHOLD" | bc -l) )); then
            echo -e "  ${RED}❌ Lines: $LINES% (below $THRESHOLD% threshold)${NC}"
            OVERALL_PASS=0
        else
            echo -e "  ${GREEN}✅ Lines: $LINES% (meets threshold)${NC}"
        fi
    fi
    
    if [ $OVERALL_PASS -eq 0 ]; then
        echo -e "\n${YELLOW}⚠️  Overall coverage does not meet the 80% threshold for all metrics${NC}"
        echo -e "${DIM}Consider adding more tests to improve coverage${NC}"
    else
        echo -e "\n${GREEN}✅ Overall coverage meets the 80% threshold for all metrics!${NC}"
    fi
    
else
    echo -e "${RED}❌ Tests: FAILED${NC}\n"
    
    # Show test failures
    echo -e "${RED}${BOLD}Test Output:${NC}"
    head -50 "$TEMP_FILE" | while IFS= read -r line; do
        if [[ "$line" =~ "FAIL" ]]; then
            echo -e "${RED}$line${NC}"
        elif [[ "$line" =~ "Error" ]]; then
            echo -e "${YELLOW}$line${NC}"
        else
            echo -e "${DIM}$line${NC}"
        fi
    done
    
    TESTS_FAILED=1
fi

# Clean up temp file
rm -f "$TEMP_FILE"

# Rust tests with coverage
print_section "🦀 Rust Tests with Coverage"

# Save current directory
CURRENT_DIR=$(pwd)
cd "$CURRENT_DIR/src-tauri"

# Check if cargo-tarpaulin is installed
if command -v cargo-tarpaulin &> /dev/null; then
    echo -e "${DIM}Running Rust tests with coverage (using tarpaulin)...${NC}"
    echo -e "${DIM}This may take a few moments...${NC}\n"
    
    # Run tarpaulin with stdout output, but only show the last part to avoid clutter
    TARPAULIN_OUTPUT=$(cargo tarpaulin --out Stdout 2>&1)
    RUST_TEST_STATUS=$?
    
    if [ $RUST_TEST_STATUS -eq 0 ]; then
        # Show only the coverage summary at the end
        echo "$TARPAULIN_OUTPUT" | tail -30
    else
        # Show error message
        echo -e "${YELLOW}⚠️  Tarpaulin failed. Falling back to regular cargo test.${NC}"
        echo -e "${DIM}Error: $(echo "$TARPAULIN_OUTPUT" | grep -E "ERROR|error:" | head -3)${NC}"
        
        # Fallback to regular cargo test
        cargo test --quiet
        RUST_TEST_STATUS=$?
    fi
    
    if [ $RUST_TEST_STATUS -eq 0 ]; then
        echo -e "\n${GREEN}✅ Rust tests passed with coverage${NC}"
    else
        echo -e "\n${RED}❌ Rust tests failed${NC}"
        TESTS_FAILED=1
    fi
else
    # Fallback to regular cargo test
    echo -e "${YELLOW}⚠️  cargo-tarpaulin not installed. Running tests without coverage.${NC}"
    echo -e "${DIM}Install with: cargo install cargo-tarpaulin${NC}\n"
    
    cargo test --quiet
    RUST_TEST_STATUS=$?
    
    if [ $RUST_TEST_STATUS -eq 0 ]; then
        echo -e "${GREEN}✅ All Rust tests passed${NC}"
        RUST_TEST_COUNT=$(cargo test 2>&1 | grep -E "test result: ok" | grep -oE "[0-9]+ passed" | awk '{sum+=$1} END {print sum}')
        echo -e "${DIM}Total: $RUST_TEST_COUNT tests passed${NC}"
    else
        echo -e "${RED}❌ Rust tests failed${NC}"
        TESTS_FAILED=1
    fi
fi

cd "$CURRENT_DIR"

# Calculate elapsed time
END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

# Final Summary
echo -e "\n${BLUE}${BOLD}╔═══════════════════════════════════════════════════════╗
║              📋 Final Summary                         ║
╚═══════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BOLD}Overall Results:${NC}"
if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "  • Status: ${GREEN}✅ ALL TESTS PASSED${NC}"
else
    echo -e "  • Status: ${RED}❌ SOME TESTS FAILED${NC}"
fi
echo -e "  • Duration: ${ELAPSED}s"

echo -e "\n${BOLD}Reports:${NC}"
echo -e "  • HTML Coverage: ${CYAN}coverage/index.html${NC}"
echo -e "  • Open with: ${DIM}open coverage/index.html${NC}"

echo -e "\n${BOLD}Coverage Targets:${NC}"
echo -e "  • Required: ${YELLOW}80%${NC} for all metrics"
echo -e "  • Recommended: ${GREEN}90%+${NC} for critical code"

# Rust coverage tip
if ! command -v cargo-tarpaulin &> /dev/null; then
    echo -e "\n${YELLOW}💡 For Rust coverage reports:${NC}"
    echo -e "   ${CYAN}cargo install cargo-tarpaulin${NC}"
fi

echo ""
exit $TESTS_FAILED