#!/bin/bash

# DeepRead-AI Test Runner Script
# This script runs React tests (unit/integration), Rust tests, and generates coverage reports

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_section() {
    echo -e "${PURPLE}[SECTION]${NC} $1"
}

# Print header
echo "=============================================="
echo "🧪 DeepRead-AI Testing Suite"
echo "=============================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_warning "node_modules not found. Installing dependencies..."
    pnpm install
fi

# Function to run unit tests
run_unit_tests() {
    print_status "Running unit tests..."

    if pnpm test:unit; then
        print_success "Unit tests passed! ✅"
        return 0
    else
        print_error "Unit tests failed! ❌"
        return 1
    fi
}

# Function to run integration tests
run_integration_tests() {
    print_status "Running integration tests..."

    if pnpm test:integration; then
        print_success "Integration tests passed! ✅"
        return 0
    else
        print_error "Integration tests failed! ❌"
        return 1
    fi
}

# Function to run all tests
run_all_tests() {
    print_status "Running all tests..."

    if pnpm test; then
        print_success "All tests passed! ✅"
        return 0
    else
        print_error "Some tests failed! ❌"
        return 1
    fi
}

# Function to generate coverage report
generate_coverage() {
    print_status "Generating test coverage report..."

    if pnpm test:coverage; then
        print_success "Coverage report generated! 📊"
        
        # Check if coverage directory exists and show summary
        if [ -d "coverage" ]; then
            echo ""
            print_status "Coverage Summary:"
            if [ -f "coverage/coverage-summary.json" ]; then
                # Extract coverage percentages using grep and awk
                if command -v jq >/dev/null 2>&1; then
                    echo "📈 Lines:      $(jq -r '.total.lines.pct' coverage/coverage-summary.json)%"
                    echo "📈 Functions:  $(jq -r '.total.functions.pct' coverage/coverage-summary.json)%"
                    echo "📈 Branches:   $(jq -r '.total.branches.pct' coverage/coverage-summary.json)%"
                    echo "📈 Statements: $(jq -r '.total.statements.pct' coverage/coverage-summary.json)%"
                else
                    print_warning "jq not installed. Install jq to see detailed coverage summary."
                fi
            fi
            echo ""
            print_status "📂 Full coverage report available at: coverage/index.html"
            
            # Try to open coverage report in browser (optional)
            if command -v open >/dev/null 2>&1; then
                read -p "Open coverage report in browser? (y/n): " open_browser
                if [ "$open_browser" = "y" ]; then
                    open coverage/index.html
                fi
            fi
        fi
        return 0
    else
        print_error "Failed to generate coverage report! ❌"
        return 1
    fi
}

# Function to run linting
run_lint() {
    print_status "Running TypeScript compiler check..."

    if pnpm build; then
        print_success "TypeScript compilation successful! ✅"
        return 0
    else
        print_error "TypeScript compilation failed! ❌"
        return 1
    fi
}

# Function to run Rust tests
run_rust_tests() {
    print_section "🦀 Running Rust Tests"
    print_status "Checking Rust backend tests..."
    
    cd src-tauri
    
    if cargo test; then
        print_success "Rust tests passed! ✅"
        cd ..
        return 0
    else
        print_error "Rust tests failed! ❌"
        cd ..
        return 1
    fi
}

# Function to run all React tests
run_react_tests() {
    print_section "⚛️ Running React Tests"

    if pnpm test; then
        print_success "React tests passed! ✅"
        return 0
    else
        print_error "React tests failed! ❌"
        return 1
    fi
}

# Function to run both React and Rust tests
run_full_test_suite() {
    print_status "Running complete test suite (React + Rust)..."
    
    local react_failed=0
    local rust_failed=0
    
    # Run React tests
    echo ""
    run_react_tests || react_failed=1
    
    # Run Rust tests
    echo ""
    run_rust_tests || rust_failed=1
    
    if [ $react_failed -eq 0 ] && [ $rust_failed -eq 0 ]; then
        return 0
    else
        return 1
    fi
}

# Main execution
FAILED_COUNT=0

# Parse command line arguments
case "${1:-all}" in
    "unit")
        run_unit_tests || FAILED_COUNT=$((FAILED_COUNT + 1))
        ;;
    "integration")
        run_integration_tests || FAILED_COUNT=$((FAILED_COUNT + 1))
        ;;
    "react")
        run_react_tests || FAILED_COUNT=$((FAILED_COUNT + 1))
        ;;
    "rust")
        run_rust_tests || FAILED_COUNT=$((FAILED_COUNT + 1))
        ;;
    "coverage")
        generate_coverage || FAILED_COUNT=$((FAILED_COUNT + 1))
        ;;
    "lint")
        run_lint || FAILED_COUNT=$((FAILED_COUNT + 1))
        ;;
    "all")
        echo "🚀 Running complete test suite..."
        echo ""
        
        # Run TypeScript compilation check
        print_section "📝 TypeScript Compilation"
        run_lint || FAILED_COUNT=$((FAILED_COUNT + 1))
        echo ""
        
        # Run all React tests with coverage
        print_section "📊 React Tests with Coverage"
        generate_coverage || FAILED_COUNT=$((FAILED_COUNT + 1))
        echo ""
        
        # Run Rust tests
        run_rust_tests || FAILED_COUNT=$((FAILED_COUNT + 1))
        echo ""
        
        ;;
    "help"|"-h"|"--help")
        echo "Usage: ./test.sh [option]"
        echo ""
        echo "Options:"
        echo "  unit         Run React unit tests only"
        echo "  integration  Run React integration tests only"
        echo "  react        Run all React tests"
        echo "  rust         Run Rust tests only"
        echo "  coverage     Run React tests with coverage report"
        echo "  lint         Run TypeScript compilation check"
        echo "  all          Run complete test suite (React + Rust) [default]"
        echo "  help         Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./test.sh            # Run all tests (React + Rust)"
        echo "  ./test.sh react      # Run only React tests"
        echo "  ./test.sh rust       # Run only Rust tests"
        echo "  ./test.sh coverage   # Run React tests with coverage"
        echo ""
        exit 0
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Use './test.sh help' for usage information."
        exit 1
        ;;
esac

echo ""
echo "=============================================="

# Final summary
if [ $FAILED_COUNT -eq 0 ]; then
    print_success "🎉 All operations completed successfully!"
    echo ""
    echo "✅ Your code is ready for production!"
    exit 0
else
    print_error "❌ $FAILED_COUNT operation(s) failed!"
    echo ""
    echo "💡 Please fix the issues before proceeding."
    exit 1
fi