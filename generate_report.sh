#!/usr/bin/env bash

# Name of the output file
OUTPUT_FILE="repo_report.txt"

# Clean up any existing output file
rm -f "$OUTPUT_FILE"

#######################################
# 1. Generate and append repo structure
#######################################
echo "====================================" >> "$OUTPUT_FILE"
echo "          REPO STRUCTURE            " >> "$OUTPUT_FILE"
echo "====================================" >> "$OUTPUT_FILE"

# Use `tree` to list directory structure.
#   -a : show hidden files
#   -I : ignore patterns (regex-like)
# Here we add patterns to ignore:
#   - node_modules, package-lock.json, various image files, .DS_Store,
#   - .git (git logs), abis (the contract src/abis folder), and
#   - main.0d424902.js (the unwanted file)
tree -a \
  -I "node_modules|package-lock.json|*.ico|*.png|*.jpg|*.jpeg|*.svg|*.gif|.DS_Store|.git|abis|main.0d424902.js" \
  . >> "$OUTPUT_FILE" 2>/dev/null

#######################################
# 2. Append contents of important files
#######################################
echo -e "\n\n====================================" >> "$OUTPUT_FILE"
echo "          FILE CONTENTS             " >> "$OUTPUT_FILE"
echo "====================================" >> "$OUTPUT_FILE"

# Find files with specific extensions
find . \
  -type f \
  \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.sh" -o -name "*.json" \) \
  -not -path "*node_modules*" \
  -not -path "*.next*" \
  -not -name "package-lock.json" \
  -not -name "pnpm-lock.yaml" \
  -not -name "yarn.lock" \
  -not -path "*/.git/*" \
  -print | while read -r file
do
  echo -e "\n-------- $file --------" >> "$OUTPUT_FILE"
  cat "$file" >> "$OUTPUT_FILE"
done

echo -e "\nDone! Report generated in '$OUTPUT_FILE'."
