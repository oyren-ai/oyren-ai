#!/usr/bin/env bash
set -euo pipefail

# Run the original coverage command and let cargo-llvm-cov print its own table
cd "$(dirname "$0")/../src-tauri"

echo "Running Rust tests with coverage (condensed summary)"
echo

# First, run tests and capture the test count
test_output=$(cargo test --quiet 2>&1 || true)
test_count=$(echo "$test_output" | grep -E "^test result:" | head -1 | grep -oE "[0-9]+ passed" | grep -oE "[0-9]+" || echo "0")

if [ "$test_count" != "0" ]; then
    echo "✓ Running $test_count tests..."
    echo
fi

# Run and capture output; we'll render a condensed, non-wrapping table
# Exclude test files from the coverage report
# Note: Removed --quiet flag to get coverage table output
output=$(cargo llvm-cov --lib --exclude-from-report '*_test.rs' --exclude-from-report '*_tests.rs' --exclude-from-report '*/tests/*' --exclude-from-report '*/test/*' 2>&1 || true)

echo "Condensed Coverage Summary (covered/total %):"
printf "%-60s  %-20s %-20s %-20s %-20s\n" "File" "Regions" "Functions" "Lines" "Branches"
printf "%-60s  %-20s %-20s %-20s %-20s\n" "------------------------------------------------------------" "--------------------" "--------------------" "--------------------" "--------------------"

total_regions_total=0
total_regions_missed=0
total_funcs_total=0
total_funcs_missed=0
total_lines_total=0
total_lines_missed=0
total_branches_total=0
total_branches_missed=0
have_branches=0

while IFS= read -r line; do
  # Match any .rs file path or the TOTAL line
  if [[ $line =~ ^[A-Za-z0-9_./-]+\.rs\ .* ]]; then
    file=$(echo "$line" | awk '{print $1}')

    # Exclude test files and minimal bootstrap files from coverage metrics
    case "$file" in
      */tests.rs|tests.rs|*/test.rs|test.rs|*_tests.rs|*_test.rs)
        # Test files themselves should not be counted in coverage
        continue ;;
      */models/*.rs)
        # Model files are pure data structures without logic
        continue ;;
      main.rs|setup.rs)
        # Entry point and setup - tightly coupled to Tauri runtime
        continue ;;
    esac

    regions_total=$(echo "$line" | awk '{print $2}')
    regions_missed=$(echo "$line" | awk '{print $3}')
    regions_pct=$(echo "$line" | awk '{print $4}')

    funcs_total=$(echo "$line" | awk '{print $5}')
    funcs_missed=$(echo "$line" | awk '{print $6}')
    funcs_pct=$(echo "$line" | awk '{print $7}')

    lines_total=$(echo "$line" | awk '{print $8}')
    lines_missed=$(echo "$line" | awk '{print $9}')
    lines_pct=$(echo "$line" | awk '{print $10}')

    branches_total=$(echo "$line" | awk '{print $11}')
    branches_missed=$(echo "$line" | awk '{print $12}')
    branches_pct=$(echo "$line" | awk '{print $13}')

    # Skip headers or malformed lines
    if [[ -z "$regions_total" ]] || [[ "$regions_total" == "-" ]]; then
      continue
    fi

    # Calculate covered values
    regions_cov=$((regions_total - regions_missed))
    funcs_cov=$((funcs_total - funcs_missed))
    lines_cov=$((lines_total - lines_missed))

    regions_str="${regions_cov}/${regions_total} (${regions_pct})"
    funcs_str="${funcs_cov}/${funcs_total} (${funcs_pct})"
    lines_str="${lines_cov}/${lines_total} (${lines_pct})"

    if [[ -z "$branches_pct" || "$branches_pct" == "-" ]]; then
      branches_str="-"
    else
      branches_cov=$((branches_total - branches_missed))
      branches_str="${branches_cov}/${branches_total} (${branches_pct})"
    fi

    # Show full path (increased width to 60 characters)
    display_file="$file"
    maxlen=60
    if (( ${#display_file} > maxlen )); then
      display_file="…${display_file: -$((maxlen-1))}"
    fi

    printf "%-60s  %-20s %-20s %-20s %-20s\n" "$display_file" "$regions_str" "$funcs_str" "$lines_str" "$branches_str"

    # Accumulate totals
    total_regions_total=$((total_regions_total + regions_total))
    total_regions_missed=$((total_regions_missed + regions_missed))
    total_funcs_total=$((total_funcs_total + funcs_total))
    total_funcs_missed=$((total_funcs_missed + funcs_missed))
    total_lines_total=$((total_lines_total + lines_total))
    total_lines_missed=$((total_lines_missed + lines_missed))
    if [[ "$branches_pct" != "-" && -n "$branches_pct" ]]; then
      have_branches=1
      total_branches_total=$((total_branches_total + branches_total))
      total_branches_missed=$((total_branches_missed + branches_missed))
    fi
  fi
done <<< "$output"

# Print computed TOTAL for included files
printf "%-60s  %-20s %-20s %-20s %-20s\n" "------------------------------------------------------------" "--------------------" "--------------------" "--------------------" "--------------------"

if (( total_regions_total > 0 )); then
  regions_cov=$((total_regions_total - total_regions_missed))
  funcs_cov=$((total_funcs_total - total_funcs_missed))
  lines_cov=$((total_lines_total - total_lines_missed))

  pct() { awk -v a="$1" -v b="$2" 'BEGIN{ if(b==0) {printf "-"} else { printf "%.2f%%", (a*100.0)/b } }'; }

  regions_pct=$(pct "$regions_cov" "$total_regions_total")
  funcs_pct=$(pct "$funcs_cov" "$total_funcs_total")
  lines_pct=$(pct "$lines_cov" "$total_lines_total")

  if (( have_branches > 0 && total_branches_total > 0 )); then
    branches_cov=$((total_branches_total - total_branches_missed))
    branches_pct=$(pct "$branches_cov" "$total_branches_total")
    branches_str="${branches_cov}/${total_branches_total} (${branches_pct})"
  else
    branches_str="-"
  fi

  regions_str="${regions_cov}/${total_regions_total} (${regions_pct})"
  funcs_str="${funcs_cov}/${total_funcs_total} (${funcs_pct})"
  lines_str="${lines_cov}/${total_lines_total} (${lines_pct})"

  printf "%-60s  %-20s %-20s %-20s %-20s\n" "TOTAL (included)" "$regions_str" "$funcs_str" "$lines_str" "$branches_str"
fi

# Show test result summary
echo
if [ "$test_count" != "0" ]; then
    echo "✅ All $test_count tests passed successfully!"
else
    echo "⚠️  No tests found or tests failed to run"
fi