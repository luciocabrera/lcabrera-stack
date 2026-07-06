#!/usr/bin/env bash
# Runs a full fallow scan and captures JSON output for fallow-code-checker Step 2.
#
# Usage: run-fallow.sh [workspace-glob]
#
# Arguments:
#   workspace-glob   Optional fallow -w scope (exact package name, workspace
#                    path, glob, or ! negation). Default: entire monorepo.
#
# Environment:
#   FALLOW_WORKSPACE Fallback scope when no argument is given.
#   OUTPUT_DIR       Pre-set run directory (packages/agent-runner sets this for
#                    UI-triggered scans — TECH_SPEC §2.6). Default:
#                    reports/fallow/runs/<timestamp>/ (the canonical fallow
#                    output root — see AGENTS.md "Fallow Static Analysis")
#
# Examples:
#   bash .github/skills/fallow-code-checker/scripts/run-fallow.sh
#   bash .github/skills/fallow-code-checker/scripts/run-fallow.sh 'apps/react-router'
#   bash .github/skills/fallow-code-checker/scripts/run-fallow.sh 'apps/*,!apps/shared'
#   OUTPUT_DIR=reports/fallow/runs/my-run bash .github/skills/fallow-code-checker/scripts/run-fallow.sh
#
# Works from any directory inside the repo — it cd's to the repo root itself.
set -euo pipefail

# Fallow is configured once at the repo root (.fallowrc.json) and auto-detects
# all pnpm workspaces — always run from the root. The full dependency graph is
# analyzed either way; the workspace glob only scopes the reported findings.
cd "$(git rev-parse --show-toplevel)"

WORKSPACE="${1:-${FALLOW_WORKSPACE:-}}"

# Honor a pre-set OUTPUT_DIR (packages/agent-runner sets this for a
# UI-triggered scan of another project — TECH_SPEC §2.6) — otherwise fall
# back to today's self-generated timestamped path for the interactive case.
if [[ -z "${OUTPUT_DIR:-}" ]]; then
  TIMESTAMP=$(date +%Y-%m-%d--%H-%M-%S)
  OUTPUT_DIR="reports/fallow/runs/$TIMESTAMP"
fi

mkdir -p "$OUTPUT_DIR"
if [[ -n "$WORKSPACE" ]]; then
  vp run fallow:full -- -w "$WORKSPACE"
  npx fallow -w "$WORKSPACE" --format json --output-file "$OUTPUT_DIR/fallow.raw.json" --quiet
else
  vp run fallow:full
  npx fallow --format json --output-file "$OUTPUT_DIR/fallow.raw.json" --quiet
fi
echo "Run directory: $OUTPUT_DIR/"
