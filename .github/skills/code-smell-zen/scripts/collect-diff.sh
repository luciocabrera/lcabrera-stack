#!/usr/bin/env bash
# Collects git diff stats and unified diffs for code-smell-zen Step 1.
# Usage: collect-diff.sh [base-branch]
set -euo pipefail

BASE="${1:-}"

if [[ -z "$BASE" ]]; then
  BASE=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed "s@^refs/remotes/@@")
  [[ -z "$BASE" ]] && BASE="origin/main"
  git rev-parse "$BASE" >/dev/null 2>&1 || BASE="main"
  git rev-parse "$BASE" >/dev/null 2>&1 || BASE="HEAD"
fi

if ! git rev-parse "$BASE" >/dev/null 2>&1; then
  echo "ERROR: base $BASE not found. Pass an explicit branch: /smell [branch]" >&2
  exit 1
fi

echo "===== BASE: $BASE ====="
echo

if [ "$BASE" = "HEAD" ]; then
  echo "(No remote or base branch found — showing full working-tree diff against HEAD)"
  echo
  echo "----- Stat (staged + unstaged) -----"
  git diff --stat HEAD || true
  echo
  echo "===== Working-tree diff (staged + unstaged, -U10) ====="
  git diff -U10 HEAD || true
else
  echo "----- Stat (committed vs $BASE) -----"
  git diff --stat "$BASE"...HEAD || true
  echo
  echo "----- Stat (working tree, staged+unstaged) -----"
  git diff --stat HEAD || true
  echo
  echo "===== Committed diff (vs $BASE, -U10) ====="
  git diff -U10 "$BASE"...HEAD || true
  echo
  echo "===== Working-tree diff (staged + unstaged, -U10) ====="
  git diff -U10 HEAD || true
fi
