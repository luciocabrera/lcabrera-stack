#!/usr/bin/env bash
# Runs a full fallow scan and captures JSON output for fallow-code-checker Step 2.
# Usage: run-fallow.sh
set -euo pipefail

TIMESTAMP=$(date +%Y-%m-%d--%H-%M-%S)
OUTPUT_DIR=".tmp/fallow-code-checker/$TIMESTAMP"

mkdir -p "$OUTPUT_DIR"
vp run fallow:full
npx fallow --format json --output-file "$OUTPUT_DIR/fallow.raw.json" --quiet
echo "Run directory: $OUTPUT_DIR/"
