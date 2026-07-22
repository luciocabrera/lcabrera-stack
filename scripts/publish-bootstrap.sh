#!/usr/bin/env bash
#
# publish-bootstrap.sh — the one-time manual first publish of the public packages.
#
# Why this exists at all: npm's trusted publishing binds a workflow to a package
# that ALREADY EXISTS, so a brand-new scoped package has nothing to attach the
# trust to. Every package therefore needs exactly one publish by hand before CI
# can take over, and this is that publish. It should be needed once per package,
# ever — after this, `release.yml` publishes with no credential at all.
#
# Why a script rather than a list of commands: an npm version is PERMANENT. It
# cannot be replaced, and unpublishing is restricted and blocks reuse of the
# number. A publish run from a stale checkout, from the wrong account, or before
# the version bump has merged cannot be undone — so every one of those is checked
# here BEFORE anything is sent, rather than discovered afterwards.
#
# It is safe to re-run. Each package is published only when its exact version is
# not already on the registry, so a run that fails halfway can simply be repeated.
#
# Usage (from the repo root):
#   bash scripts/publish-bootstrap.sh              # publish
#   bash scripts/publish-bootstrap.sh --dry-run    # check everything, send nothing
#
# Authentication is NOT handled here, on purpose: a script that takes a token has
# to put it somewhere, and the point of the trusted-publishing setup this unlocks
# is that no stored token exists. Log in once beforehand —
# `npm login --auth-type=legacy` — and this verifies the result instead.
#
# Env:
#   NPM_EXPECTED_USER  npm account that must own the scope (default: lcabrera)
#
# Exit codes: 0 = every package is published at its current version, 1 = a
# precondition failed and nothing was sent.
set -euo pipefail

DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

PACKAGES=(utils api server ui)
EXPECTED_USER="${NPM_EXPECTED_USER:-lcabrera}"

fail() {
  echo ""
  echo "✗ $1" >&2
  shift
  for line in "$@"; do echo "  $line" >&2; done
  exit 1
}

step() { echo ""; echo "▶ $1"; }

read_manifest_field() {
  node -p "JSON.parse(require('node:fs').readFileSync('packages/$1/package.json','utf8')).$2 ?? ''"
}

# ---------------------------------------------------------------------------
# Preflight. Nothing is sent until every one of these passes.
# ---------------------------------------------------------------------------

step "Checking the working copy"

[[ -f package.json && -d packages ]] ||
  fail "Run this from the repository root." "cd /home/lucio/workspace/vite-react-compiler"

[[ -z "$(git status --porcelain)" ]] ||
  fail "The working tree has uncommitted changes." \
    "Publishing builds from what is on disk, so it would ship them." \
    "Commit or stash first."

branch="$(git rev-parse --abbrev-ref HEAD)"
[[ "$branch" == "main" ]] ||
  fail "On branch '$branch', not main." \
    "The published bits must be what merged, not what is in flight."

git fetch origin main --quiet
[[ "$(git rev-parse HEAD)" == "$(git rev-parse origin/main)" ]] ||
  fail "Local main is not identical to origin/main." "Run: git pull"

step "Checking the packages are releasable"

for package in "${PACKAGES[@]}"; do
  name="$(read_manifest_field "$package" name)"
  version="$(read_manifest_field "$package" version)"
  private="$(read_manifest_field "$package" private)"

  [[ "$private" != "true" ]] ||
    fail "$name is still marked private." \
      "That flag is what stops an accidental publish, so npm refuses (EPRIVATE)." \
      "The release PR that clears it has not merged yet."

  [[ "$version" != "0.0.0" ]] ||
    fail "$name is still at 0.0.0." \
      "An npm version is permanent: publishing the placeholder would burn it," \
      "and every real release would sit on top of a version that can never be" \
      "reused. Merge the release PR that sets a real version first."

  echo "  $name@$version"
done

step "Checking npm authentication"

# Deliberately does not configure credentials itself. A script that accepts a
# token has to store it somewhere, and the whole direction of travel here is
# towards no stored token at all — so authenticating stays a separate, explicit
# act and this only checks the result.
npm whoami >/dev/null 2>&1 ||
  fail "npm is not authenticated." \
    "Log in once, then re-run this script:" \
    "  npm login --auth-type=legacy"

actual_user="$(npm whoami)"
[[ "$actual_user" == "$EXPECTED_USER" ]] ||
  fail "Logged in to npm as '$actual_user', expected '$EXPECTED_USER'." \
    "The @lcabrera scope belongs to that account; publishing as anyone else" \
    "fails with a 403 that reads like a permissions problem instead."
echo "  npm user: $actual_user"

# ---------------------------------------------------------------------------
# Build. Consumers install `dist`, and publishConfig.exports points there, so a
# publish without a build would ship a tarball whose every export is missing.
# ---------------------------------------------------------------------------

step "Building"
vp install --frozen-lockfile
vp run packages:build
vp run publish:verify

# ---------------------------------------------------------------------------
# Publish, skipping anything already on the registry so a re-run is harmless.
# ---------------------------------------------------------------------------

published=()
skipped=()

for package in "${PACKAGES[@]}"; do
  name="$(read_manifest_field "$package" name)"
  version="$(read_manifest_field "$package" version)"

  step "$name@$version"

  if npm view "$name@$version" version >/dev/null 2>&1; then
    echo "  Already on the registry — skipping."
    skipped+=("$name@$version")
    continue
  fi

  if [[ "$DRY_RUN" == true ]]; then
    echo "  [dry run] would publish"
    continue
  fi

  (cd "packages/$package" && npm publish --access public)
  published+=("$name@$version")
done

# ---------------------------------------------------------------------------
# What is left, and what to stop carrying.
# ---------------------------------------------------------------------------

echo ""
if [[ "$DRY_RUN" == true ]]; then
  echo "Dry run complete — every precondition passed and nothing was sent."
  exit 0
fi

echo "Published: ${#published[@]}   Already present: ${#skipped[@]}"
for entry in ${published[@]+"${published[@]}"}; do echo "  + $entry"; done

if [[ ${#published[@]} -gt 0 ]]; then
  cat <<'NEXT'

Two things remain, and they are what retire the token for good.

1. Configure trusted publishing for EACH package on npmjs.com:
     the package -> Settings -> Trusted Publisher -> GitHub Actions
       Organization or user: luciocabrera
       Repository:           vite-react-compiler
       Workflow filename:    release.yml

2. Log out of npm once all four are configured, so no credential is left behind:
     npm logout
   and remove the bootstrap token from your env file and from npmjs.com.

After that no token exists anywhere: releases are
  vp run release:add  ->  vp run release:version  ->  open a PR  ->  merge
NEXT
fi
