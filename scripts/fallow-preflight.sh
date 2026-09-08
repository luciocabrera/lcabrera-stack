#!/usr/bin/env bash
#
# fallow-preflight.sh — run the new-only fallow audit the way CI runs it.
#
# The audit is the gate this repo most often fails on, and it was the one gate
# with no local form: it needs a merge base and measured coverage, so the
# pre-push hook left it to CI. That is a round trip per finding.
#
# Coverage first, and it is not optional. `fallow audit` scores CRAP as
# cyclomatic² × (1 − coverage)³ + cyclomatic; with no coverage data it estimates
# coverage from whether a colocated test file exists, so an unfed audit reports
# ordinary branching as critical. `--changed` restricts the suites to the
# workspaces the diff touched, which is all a new-only audit consults.
#
# Usage:
#   bash scripts/fallow-preflight.sh [extra fallow args…]
#
# Env:
#   TEST_CHANGED_BASE  base ref to attribute findings against (default: origin/main)
#
# Exit codes: fallow's — 0 = nothing new introduced, 1 = introduced findings,
# 2 = the audit could not run. Which of the last two happened is said here rather
# than by the caller: a failed coverage merge and a failed audit reach a hook as
# one non-zero status, and reading "your diff introduced dead code" after the
# merge base could not be resolved sends a developer looking for code that is not
# there. `vp run` propagates a task's exit code verbatim, so the distinction
# survives.
set -uo pipefail

BASE="${TEST_CHANGED_BASE:-origin/main}"
COVERAGE="reports/fallow/coverage/coverage-final.json"

if ! vp run coverage:merge -- --changed; then
  echo ""
  echo "✗ fallow preflight: the coverage merge failed, so the audit never ran."
  echo "  Its output above says why; an unresolvable merge base with $BASE is the"
  echo "  usual cause. Nothing has been attributed to this diff."
  exit 2
fi

vp run fallow:audit --base "$BASE" --coverage "$COVERAGE" "$@"
status=$?

if [[ "$status" -eq 1 ]]; then
  echo ""
  echo "✗ fallow preflight: the audit attributes new dead code, complexity or"
  echo "  duplication to this diff. Inherited findings are baselined and do not"
  echo "  fail here; only what the diff introduces does."
elif [[ "$status" -ne 0 ]]; then
  echo ""
  echo "✗ fallow preflight: the audit could not run (exit $status) — a runtime or"
  echo "  configuration failure, not a finding. Nothing has been attributed to"
  echo "  this diff."
fi

exit "$status"
