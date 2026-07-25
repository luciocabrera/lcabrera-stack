#!/usr/bin/env bash
# Create the planning session's Milestones + issues on GitHub.
#
# DRAFT HELPER — review before running. `gh` must be installed and authenticated
# (`gh auth status`). Nothing here runs automatically; the planner produced this
# for a human to execute after approving docs/agents/planning/issues.md.
#
# Strategy: create milestones, then issues (capturing the real number each returns),
# then a second pass edits bodies to wire cross-issue dependencies. Run from repo root.
#
# Usage:
#   ./docs/agents/planning/create-issues.sh milestones   # step 1: milestones only
#   ./docs/agents/planning/create-issues.sh issues        # step 2: create issues
#   ./docs/agents/planning/create-issues.sh               # both
set -euo pipefail

need() { command -v "$1" >/dev/null 2>&1 || { echo "missing: $1" >&2; exit 1; }; }
need gh

create_milestones() {
  for m in \
    "M1 - Foundation" \
    "M2 - Abstractions" \
    "M3 - Cross-App Integration" \
    "M4 - Hardening & QA" \
    "M5 - Release Prep"; do
    echo "milestone: $m"
    gh api repos/:owner/:repo/milestones -f title="$m" >/dev/null 2>&1 \
      || echo "  (exists or failed — check manually)"
  done
}

# create_issue <title> <milestone> "<label,label>" <body-file>
# Prints the created issue number so the caller can map planning IDs → real numbers.
create_issue() {
  local title="$1" milestone="$2" labels="$3" body_file="$4"
  gh issue create \
    --title "$title" \
    --milestone "$milestone" \
    --label "$labels" \
    --body-file "$body_file"
}

# NOTE: bodies are NOT inlined here — extract each issue's sections 1–8 from
# docs/agents/planning/issues.md into a temp file, or (recommended) split issues.md
# into per-issue body files first. Titles/labels/milestones below match issues.md.
#
# Epics first (parents), then P-* in wave order, then G-*. Dependency wiring
# (blocking/blockedBy/parent/children) is a SECOND pass once real numbers exist —
# `gh issue edit <n> --body-file <updated>` or use GitHub's native sub-issue links.

echo "This script is a scaffold. Fill in per-issue --body-file paths from issues.md"
echo "before running the 'issues' step. Milestones can be created now:"

case "${1:-all}" in
  milestones) create_milestones ;;
  issues) echo "populate body files first (see comments above)"; exit 2 ;;
  all) create_milestones; echo "then populate body files and run: $0 issues" ;;
  *) echo "usage: $0 [milestones|issues]"; exit 2 ;;
esac
