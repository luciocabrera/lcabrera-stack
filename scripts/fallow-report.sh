#!/usr/bin/env bash
# Runs a full fallow scan and captures its JSON alongside the human output, for
# the fallow-code-checker skill and the fallow-scan agent. Both need the same
# invocation, which is why it is a script and not a line in each of them.
#
# Usage: vp run fallow:report [-w <workspace-glob>]
#
# Writes reports/fallow/runs/<timestamp>/fallow.raw.json and echoes the
# directory. Set OUTPUT_DIR to run into a directory you already own.
set -euo pipefail

# Fallow is configured once at the repo root (.fallowrc.json) and auto-detects
# all pnpm workspaces — always run from the root. The workspace glob scopes the
# reported findings only; the full dependency graph is analyzed either way.
cd "$(git rev-parse --show-toplevel)"

# `-w <glob>` to match every other fallow task; a bare glob is also accepted.
WORKSPACE="${FALLOW_WORKSPACE:-}"
if [[ "${1:-}" == "-w" ]]; then
  WORKSPACE="${2:?-w needs a workspace glob}"
elif [[ -n "${1:-}" ]]; then
  WORKSPACE="$1"
fi

if [[ -z "${OUTPUT_DIR:-}" ]]; then
  OUTPUT_DIR="reports/fallow/runs/$(date +%Y-%m-%d--%H-%M-%S)"
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
