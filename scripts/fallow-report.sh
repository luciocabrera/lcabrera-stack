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
# Findings make fallow exit non-zero. This reports them, it does not gate on
# them, so neither pass may abort the other — but a missing artifact must, or
# the skill reads a file that is not there and calls it the source of truth.
if [[ -n "$WORKSPACE" ]]; then
  vp run fallow:full -w "$WORKSPACE" || true
  vp run fallow:full -w "$WORKSPACE" --format json --output-file "$OUTPUT_DIR/fallow.raw.json" --quiet || true
else
  vp run fallow:full || true
  vp run fallow:full --format json --output-file "$OUTPUT_DIR/fallow.raw.json" --quiet || true
fi

if [[ ! -s "$OUTPUT_DIR/fallow.raw.json" ]]; then
  echo "fallow wrote no JSON to $OUTPUT_DIR/fallow.raw.json" >&2
  exit 1
fi
echo "Run directory: $OUTPUT_DIR/"
