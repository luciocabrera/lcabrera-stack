#!/usr/bin/env bash
#
# deps-refresh.sh — refresh every dependency and open a build(deps) PR, in one command.
#
# Wraps the daily update chore and the ceremony around it (issue, branch, commit,
# push, PR) so the whole thing is one command instead of a remembered sequence.
# "Everything updatable" is the intent, in one pass:
#   - vp itself (the global CLI) via `vp upgrade`
#   - pnpm (the pinned `packageManager`) via `corepack use pnpm@latest`
#   - the pnpm catalog + every workspace package.json via taze — which also bumps
#     the `vite-plus` dep, and with it vite/rolldown/vitest/oxlint/oxfmt/tsdown
# then clean + reinstall so the tree resolves against all of it. Superseded
# scripts/update-deps.sh, which only touched apps/* and left the catalog — where
# nearly every version actually lives — to be edited by hand.
#
# Node is NOT bumped here: this repo pins no Node version (it floats on
# engines.node), so a runtime change would not appear in the PR diff and would
# alter the machine's global default. Manage it deliberately with `vp env`.
#
# Two things here are deliberate and worth knowing before editing:
#   - It reaches for pnpm and taze DIRECTLY. The repo rule is "use vp, not pnpm",
#     but that rule is about commands vp wraps (install/dev/build/lint). `pnpm
#     clean` and catalog updating have no vp equivalent, so there is nothing to
#     route through vp. The general policy nuance is tracked in issue #334.
#   - TypeScript is pinned (EXCLUDE below) — a known compatibility issue keeps it
#     at its current major until #334-adjacent work clears it. taze --exclude
#     holds it while everything else moves.
#
# It STOPS and hands off rather than papering over trouble: a failing quality gate
# (run by the pre-push hook) aborts the push, leaving the branch for a human; it
# never auto-merges. On a day with nothing to update it makes no issue/branch/PR.
#
# Usage:
#   vp run deps:refresh              # full run: update, gate (via pre-push), open PR
#   vp run deps:refresh -- --dry-run # preview which deps would move; change nothing
#   vp run deps:refresh -- --base <branch>   # branch/PR against <branch> (default main)
#
# Exit codes: 0 = PR opened or nothing to update; non-zero = a step failed (the
# gate, network, or git/gh). Every failure names what broke.
set -euo pipefail

# Held back on purpose. TypeScript stays pinned for a known compatibility issue;
# extend this list (with a reason) when another package must be frozen.
EXCLUDE=(typescript)

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "deps-refresh: not in a git repository" >&2
  exit 1
}
cd "$REPO_ROOT"

base="main"
dry=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --) shift ;;
    --dry-run) dry=1; shift ;;
    --base) base="$2"; shift 2 ;;
    -h | --help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "deps-refresh: unknown argument: $1" >&2; exit 1 ;;
  esac
done

die() { local msg="$1"; echo "deps-refresh: $msg" >&2; exit 1; }
log() { local msg="$1"; printf '\n\033[1m==> %s\033[0m\n' "$msg"; }
have() { local cmd="$1"; command -v "$cmd" >/dev/null 2>&1; }

# taze's exclude flag takes one -x per package.
taze_exclude=()
for pkg in "${EXCLUDE[@]}"; do taze_exclude+=(--exclude "$pkg"); done

# `vp run` prepends node_modules/.bin to PATH, so a bare `vp` inside this script
# resolves to the LOCAL vite-plus shim — which has no `upgrade` subcommand (a
# global-only self-update) and, worse, is deleted by `pnpm clean` below, which
# breaks the reinstall with a stale hashed path. Resolve the global CLI once; it
# lives under $VP_HOME, outside the repo, so it survives the clean.
vp_global="${VP_HOME:-$HOME/.vite-plus}/bin/vp"
[[ -x "$vp_global" ]] || vp_global="$(command -v vp)" || die "cannot locate the vp CLI"

# pnpm is pinned by the `packageManager` field (version + sha512). `corepack use
# pnpm@latest` is the only thing that rewrites BOTH correctly — hand-editing the
# hash is what we avoid. corepack routes through vp as well, so resolve it the same
# durable way (it runs after `pnpm clean`, when node_modules/.bin is already gone).
corepack_global="${VP_HOME:-$HOME/.vite-plus}/bin/corepack"
[[ -x "$corepack_global" ]] || corepack_global="$(command -v corepack)" || die "cannot locate corepack"

# --- preconditions: a clean, current tree so the diff we open a PR from is only
#     the dependency change, nothing a dirty checkout dragged along ---------------
have gh || die "the GitHub CLI (gh) is required"
gh auth status >/dev/null 2>&1 || die "gh is not authenticated (run: gh auth login)"
git diff --quiet && git diff --cached --quiet || die "working tree is dirty — commit or stash first"

current_branch="$(git branch --show-current)"
[[ "$current_branch" == "$base" ]] || die "run from '$base' (on '$current_branch'). Dependency refreshes branch off $base."
git fetch -q origin "$base"
[[ "$(git rev-parse "$base")" == "$(git rev-parse "origin/$base")" ]] ||
  die "local $base is not in sync with origin/$base — pull first"

# --- dry run: show what taze would move, touch nothing ------------------------
if [[ "$dry" == 1 ]]; then
  log "Dry run — previewing catalog + package.json updates (no changes written)"
  npx --yes taze@latest -r "${taze_exclude[@]}"
  echo ""
  pnpm_current="$(grep -oE 'pnpm@[0-9][0-9.]*' package.json | head -1 || true)"
  pnpm_latest="$(npm view pnpm version 2>/dev/null || echo '?')"
  echo "pnpm (packageManager): ${pnpm_current:-?}  →  latest pnpm@${pnpm_latest}"
  echo "Held back: ${EXCLUDE[*]}"
  exit 0
fi

# --- the update pipeline ------------------------------------------------------
log "Updating vp itself (global CLI; not part of the repo diff)"
"$vp_global" upgrade || echo "deps-refresh: 'vp upgrade' failed — continuing with the current vp"

log "Removing node_modules + lockfile (pnpm clean) for a clean resolution"
pnpm clean --lockfile

log "Updating the pnpm catalog + package.json versions (taze), holding ${EXCLUDE[*]}"
taze_log="$(mktemp)"
trap 'rm -f "$taze_log"' EXIT
npx --yes taze@latest -r --write "${taze_exclude[@]}" | tee "$taze_log"

# taze does not touch the `packageManager` field, so pnpm itself would never move.
# corepack rewrites it (with hash) and installs with the new pnpm — that install IS
# the reinstall; the `vp install` below then reconciles. A soft failure (offline)
# leaves the old pin in place rather than aborting the whole refresh.
pnpm_before="$(grep -oE 'pnpm@[0-9][0-9.]*' package.json | head -1 || true)"
log "Updating pnpm itself (the pinned packageManager) to the latest release"
"$corepack_global" use pnpm@latest || echo "deps-refresh: 'corepack use pnpm@latest' failed — continuing with the current pnpm"
pnpm_after="$(grep -oE 'pnpm@[0-9][0-9.]*' package.json | head -1 || true)"

log "Reinstalling with the refreshed versions (vp install)"
"$vp_global" install

# --- did anything actually change? A no-op day makes no issue/branch/PR --------
# Decide on the manifests, not the lockfile: pnpm can reformat pnpm-lock.yaml with
# no version delta, and that churn must not open an empty PR.
if git diff --quiet -- pnpm-workspace.yaml '**/package.json'; then
  log "Dependencies already current — reverting any incidental lockfile churn and exiting"
  git checkout -q -- pnpm-lock.yaml 2>/dev/null || true
  exit 0
fi

# --- guard: the release-age floor and its exclude list drift together ----------
# minimumReleaseAge is a manual, version-pinned exclude list (pnpm-workspace.yaml).
# If it is active, fresh versions can be rejected on install or silently held; this
# script does not regenerate that list, so surface it rather than ship a broken
# lockfile. It is commented out today, so this normally stays quiet.
if grep -qE '^[[:space:]]*minimumReleaseAge:' pnpm-workspace.yaml; then
  echo "deps-refresh: WARNING — minimumReleaseAge is active; verify minimumReleaseAgeExclude still matches the bumped versions before merging." >&2
fi

# --- the ceremony: issue → branch → commit → push → PR ------------------------
# The catalog changes taze made, as a compact list for the commit + PR body.
moved="$(grep -E '·|→|->' "$taze_log" | sed -E 's/^[[:space:]]+//' | sed -E 's/\x1b\[[0-9;]*m//g' || true)"
if [[ -n "$pnpm_after" && "$pnpm_before" != "$pnpm_after" ]]; then
  moved="${pnpm_before} → ${pnpm_after} (packageManager)"$'\n'"${moved}"
fi
[[ -n "$moved" ]] || moved="(see the pnpm-workspace.yaml / package.json diff)"

log "Opening the tracking issue"
issue_body="$(cat <<'BODY'
## 1. Problem Statement

Routine dependency currency: the pnpm catalog and package.json versions drift behind upstream. Left alone, the gap grows into a large, risky upgrade.

## 2. Objective / Desired Outcome

Refresh all dependencies to their latest in-range versions (TypeScript held for a known compatibility issue), verified by the quality gate, landed as one small build(deps) PR.

## 3. Context & Background

Opened by `vp run deps:refresh` (scripts/deps-refresh.sh): vp upgrade → pnpm clean → taze → corepack use pnpm@latest → vp install, then this issue + branch + PR. Manifests + lockfile only; no source change expected.

## 4. Reproduction Steps

Not a bug — routine maintenance.

## 5. Scope Definition

### In Scope

- Version bumps in `pnpm-workspace.yaml` (catalog) and workspace `package.json` files, plus the regenerated `pnpm-lock.yaml`.

### Out of Scope

- TypeScript (pinned), and any source change to accommodate a bump — that stops the run for a human.

## 6. Acceptance Criteria

- [ ] Dependencies refreshed; TypeScript unchanged.
- [ ] Full quality gate green.
- [ ] Landed as a single build(deps) PR.
BODY
)"
issue="$(gh issue create --title "Dependency refresh" --body "$issue_body" | grep -oE '[0-9]+$')"
[[ -n "$issue" ]] || die "could not create the tracking issue"
echo "  created issue #$issue"
gh issue edit "$issue" --add-assignee @me >/dev/null

branch="build/${issue}-deps-refresh"
log "Branching $branch and committing"
git checkout -q -b "$branch"
git add -A
git commit -q -F - <<COMMIT
build(deps): refresh the toolchain and dependencies

Refresh everything updatable via \`vp run deps:refresh\`: the vp CLI, pnpm
(the pinned \`packageManager\`), and the pnpm catalog + workspace
package.json versions to their latest in-range releases (taze, which also
bumps the \`vite-plus\` dep and its bundled vite/rolldown/vitest/oxlint).
TypeScript is held at its pinned version for a known compatibility issue.

Moved:
${moved}

Manifests + lockfile only; verified by the pre-push quality gate.
COMMIT

log "Pushing (the pre-push hook runs the full quality gate; a failure stops here)"
git push -q -u origin "$branch" ||
  die "push failed — most likely the quality gate. The branch '$branch' holds the change; inspect, fix, and re-push."

log "Opening the PR"
pr_body="$(cat <<BODY
## What

Refresh everything updatable — the vp CLI, pnpm (the pinned \`packageManager\`), and the pnpm catalog + package.json versions to their latest in-range releases, TypeScript held. Automated by \`vp run deps:refresh\`.

Moved:

\`\`\`
${moved}
\`\`\`

## Why

Routine dependency hygiene in small, verified steps, so upgrades stay boring and no large risky jump accumulates.

## Verification

Full pre-push quality gate ran against the bumped tree (\`vp check\`, typecheck ×17 workspaces, eslint, Biome, tests). The push only succeeds if it is green.

## Impact Analysis

Manifests + lockfile only — the catalog, workspace package.json versions, and the pinned \`packageManager\` (pnpm); no source change. No changeset: a dependency/toolchain refresh carries no consumer-facing package change (consistent with prior refreshes). TypeScript held at its pin for a known compatibility issue.

## Test Coverage

None added — a version-only change; existing suites exercise the bumped toolchain.

## Documentation Updates

None — no public API, prop, type, or convention changed.

## Linked Issues

Resolves #${issue}

## Known Limitations

Auto-generated; review the moved versions above. Merge is intentionally left to a human.
BODY
)"
gh pr create --title "build(deps): refresh the catalog" --body "$pr_body" --base "$base" --head "$branch"

log "Done. Review the PR above and merge when the checks are green."
