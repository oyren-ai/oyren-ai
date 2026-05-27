#!/bin/bash

echo "=== CI Test Debug Script ==="
echo "Current directory: $(pwd)"
echo "Node version: $(node --version)"
echo "pnpm version: $(pnpm --version)"

echo -e "\n=== Checking package.json ==="
if [ -f "package.json" ]; then
    echo "package.json exists"
    echo "Name: $(cat package.json | grep '"name"' | head -1)"
else
    echo "ERROR: package.json not found!"
    exit 1
fi

echo -e "\n=== Checking node_modules ==="
if [ -d "node_modules" ]; then
    echo "node_modules exists"
    echo "Number of packages: $(ls node_modules | wc -l)"
else
    echo "WARNING: node_modules not found, running pnpm install..."
    pnpm install
fi

echo -e "\n=== Checking test files ==="
echo "Test files found:"
find src -name "*.test.tsx" -o -name "*.test.ts" | head -10

echo -e "\n=== Running tests ==="
pnpm test -- --run --reporter=verbose || {
    echo "Tests failed with exit code: $?"
    echo -e "\n=== Trying simple test run ==="
    npx vitest run --no-coverage || echo "Vitest failed"
}

echo -e "\n=== Script completed ==="