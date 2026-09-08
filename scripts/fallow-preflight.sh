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
# 2 = the audit could not run.
set -euo pipefail

BASE="${TEST_CHANGED_BASE:-origin/main}"
COVERAGE="reports/fallow/coverage/coverage-final.json"

vp run coverage:merge -- --changed
vp run fallow:audit --base "$BASE" --coverage "$COVERAGE" "$@"
