#!/usr/bin/env bash
#
# changed-files.sh — feed the files changed since the merge base into a runner.
#
# Why this exists: every "changed files only" gate used to inline
#
#   git diff --name-only $(git merge-base ${TEST_CHANGED_BASE:-origin/main} HEAD) | node …
#
# which fails **open**. If `git merge-base` cannot resolve — an unfetched or
# renamed base ref, a shallow clone, a fork whose base is absent — the command
# substitution is empty, `git diff --name-only` degrades to a working-tree diff
# (empty in CI), the runner reports "nothing to do" and exits 0. The gate then
# reports green having checked nothing, and the same trap sat in three required
# CI checks at once.
#
# So the base is resolved into a variable and asserted before anything runs, the
# runner is invoked directly rather than across an unguarded pipe, and
# `pipefail` propagates the runner's exit code. A base that cannot be resolved
# is now a loud failure instead of a silent pass.
#
# Usage:
#   bash scripts/changed-files.sh <runner> [args…]
#   bash scripts/changed-files.sh node scripts/run-changed.mjs typecheck
#
# Env:
#   TEST_CHANGED_BASE  base ref to compare against (default: origin/main)
#
# Exit codes: the runner's, or 1 when the merge base cannot be resolved.
set -euo pipefail

if [[ $# -eq 0 ]]; then
  echo "usage: changed-files.sh <runner> [args...]" >&2
  exit 1
fi

base_ref="${TEST_CHANGED_BASE:-origin/main}"

if ! base=$(git merge-base "$base_ref" HEAD 2>/dev/null); then
  echo "changed-files: cannot resolve a merge base with '$base_ref'." >&2
  echo "  The ref is missing or unfetched. In CI use actions/checkout with" >&2
  echo "  fetch-depth: 0; locally run 'git fetch origin main'." >&2
  echo "  Refusing to continue: an unresolved base would check nothing." >&2
  exit 1
fi

if [[ -z "$base" ]]; then
  echo "changed-files: merge base with '$base_ref' resolved to nothing." >&2
  echo "  Refusing to continue: this would silently check nothing." >&2
  exit 1
fi

git diff --name-only "$base" | "$@"
