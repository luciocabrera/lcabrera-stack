#!/usr/bin/env bash
# Runs a full fallow scan and captures its JSON output, for the interactive
# fallow-code-checker skill's Step 2. The unattended equivalent is the
# scan-report-fallow bin, which needs no vp and writes the full report contract.
#
# Usage: run-fallow.sh [workspace-glob]
#
# Arguments:
#   workspace-glob   Optional fallow -w scope (exact package name, workspace
#                    path, glob, or ! negation). Default: entire monorepo.
#
# Environment:
#   FALLOW_WORKSPACE Fallback scope when no argument is given.
#   OUTPUT_DIR       Pre-set run directory, for a caller that already owns one.
#                    Default: reports/fallow/runs/<timestamp>/
#
# Examples, with SELF standing for wherever this script sits — its own
# directory in a checkout, or node_modules/@lcabrera/scan-report/scripts when
# installed:
#   bash SELF/run-fallow.sh
#   bash SELF/run-fallow.sh 'packages/ui'
#   bash SELF/run-fallow.sh 'apps/*,!apps/shared'
#   OUTPUT_DIR=reports/fallow/runs/my-run bash SELF/run-fallow.sh
#
# Requires `vp` (Vite+) and a repo-root .fallowrc.json. Works from any directory
# inside the repository — it cd's to the root itself.
set -euo pipefail

# Fallow is configured once at the repo root (.fallowrc.json) and auto-detects
# all pnpm workspaces — always run from the root. The full dependency graph is
# analyzed either way; the workspace glob only scopes the reported findings.
cd "$(git rev-parse --show-toplevel)"

WORKSPACE="${1:-${FALLOW_WORKSPACE:-}}"

# Honor a pre-set OUTPUT_DIR — an orchestrator driving a scan of another
# project owns the run directory — otherwise fall back to a self-generated
# timestamped path for the interactive case.
if [[ -z "${OUTPUT_DIR:-}" ]]; then
  TIMESTAMP=$(date +%Y-%m-%d--%H-%M-%S)
  OUTPUT_DIR="reports/fallow/runs/$TIMESTAMP"
fi

mkdir -p "$OUTPUT_DIR"
if [[ -n "$WORKSPACE" ]]; then
  vp run fallow:full -w "$WORKSPACE"
  npx fallow -w "$WORKSPACE" --format json --output-file "$OUTPUT_DIR/fallow.raw.json" --quiet
else
  vp run fallow:full
  npx fallow --format json --output-file "$OUTPUT_DIR/fallow.raw.json" --quiet
fi
echo "Run directory: $OUTPUT_DIR/"
