#!/usr/bin/env bash
# Runs a full fallow scan and captures JSON output for fallow-code-checker Step 2.
# Usage: run-fallow.sh
set -euo pipefail

# Honor a pre-set OUTPUT_DIR (packages/agent-runner sets this for a
# UI-triggered scan of another project — TECH_SPEC §2.6) — otherwise fall
# back to today's self-generated timestamped path for the interactive case.
if [ -z "${OUTPUT_DIR:-}" ]; then
  TIMESTAMP=$(date +%Y-%m-%d--%H-%M-%S)
  OUTPUT_DIR=".tmp/fallow-code-checker/$TIMESTAMP"
fi

mkdir -p "$OUTPUT_DIR"
vp run fallow:full
npx fallow --format json --output-file "$OUTPUT_DIR/fallow.raw.json" --quiet
echo "Run directory: $OUTPUT_DIR/"
