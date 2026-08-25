#!/usr/bin/env bash
#
# deps-refresh.sh — refresh every dependency and open a build(deps) PR, in one command.
#
# Wraps the daily update chore and the ceremony around it (issue, branch, commit,
# push, PR) so the whole thing is one command instead of a remembered sequence.
# "Everything updatable" is the intent, in one pass:
#   - vp itself (the global CLI) via `vp upgrade`
#   - pnpm (the pinned `packageManager`) — taze moves the version, then
#     `corepack use pnpm@latest` rewrites the same field WITH the integrity
#     hash. Both write it; only the second makes it a real pin (#927).
#   - the pnpm catalog + every workspace package.json via taze — which also bumps
#     the `vite-plus` dep, and with it vite/rolldown/vitest/oxlint/oxfmt/tsdown
# then clean + reinstall so the tree resolves against all of it. Superseded
# scripts/update-deps.sh, which only touched apps/* and left the catalog — where
# nearly every version actually lives — to be edited by hand.
#
# Node IS bumped here, and that is declared rather than incidental. taze rewrites
# `.node-version` (it reads the file as an update target, the same as a manifest),
# so a refresh carries the pin whether or not anyone intends it. This header used
# to claim the opposite — "taze cannot move a runtime" — which was half true and
# actively misleading: taze cannot move an installed runtime, but it moves the
# PIN, and the pin is what decides the version. That wording is why a Node bump
# once rode along inside a PR describing itself as manifests-only.
#
# What makes it safe to let ride is that CI runs on the pin: setup-vp is in
# managed mode and resolves from `.node-version` (its log prints the version and
# the file it came from), so the full gate executes on the new Node before the PR
# can merge. `engines.node` is a deliberately wider band, so a minor inside it
# needs no second edit; a bump that LEAVES the band is a different change and
# must move both declarations together.
#
# What CI cannot do is update anyone's machine. Locally the vp shim is
# system-first, so the runtime comes from whatever manages it there (nvm's
# default, typically) — not from `.node-version`. A merged Node bump therefore
# leaves every local checkout running the old version, and the local pre-push
# gate silently disagrees with CI until each person installs it and repoints
# their default. That is the cost being accepted, so the commit and PR SAY the
# pin moved instead of burying it in the version list — see `node_footer` (the
# commit message) and `node_note` (the PR body) below.
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
# A stop is resumable — see --open-pr, which finishes a run whose push failed
# without opening a duplicate issue.
#
# Usage:
#   vp run deps:refresh              # full run: update, gate (via pre-push), open PR
#   vp run deps:refresh -- --dry-run # preview which deps would move; change nothing
#   vp run deps:refresh -- --open-pr # resume: push the fixed branch and open its PR
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
open_pr=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --) shift ;;
    --dry-run) dry=1; shift ;;
    --open-pr) open_pr=1; shift ;;
    --base) base="$2"; shift 2 ;;
    -h | --help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "deps-refresh: unknown argument: $1" >&2; exit 1 ;;
  esac
done

die() { local msg="$1"; echo "deps-refresh: $msg" >&2; exit 1; }
log() { local msg="$1"; printf '\n\033[1m==> %s\033[0m\n' "$msg"; }
have() { local cmd="$1"; command -v "$cmd" >/dev/null 2>&1; }

# Opens the PR for a refresh branch. Shared by the straight-through run and by
# --open-pr, so a resumed run gets the identical description rather than a
# hand-written one that drifts from it.
#
# The Impact Analysis is computed, not asserted: it used to hardcode "no source
# change", which is wrong exactly when it matters. A bump can force one — a new
# lint rule reaching existing code is the common case — and the run that hits
# it is the run whose PR needs to say so.
open_the_pr() {
  local issue="$1" branch="$2" moved="$3"
  local deps_commit extra impact pr_body
  # A Node move gets its own callout instead of a line in `moved`. It is the one
  # bump CI verifies but no machine inherits, so listing it among the packages
  # reads as "another version" when it is really a request to everyone to go
  # install something. Computed from the tree, so it appears only on runs that
  # actually moved the pin.
  local node_from node_to node_note=""
  node_from="$(git show "origin/${base}:.node-version" 2>/dev/null || git show "${base}:.node-version" 2>/dev/null || true)"
  node_to="$(cat .node-version 2>/dev/null || true)"
  node_from="${node_from//[[:space:]]/}"
  node_to="${node_to//[[:space:]]/}"
  if [[ -n "$node_to" && -n "$node_from" && "$node_from" != "$node_to" ]]; then
    node_note="

**The Node pin moves with this PR: \`${node_from}\` → \`${node_to}\`** (\`.node-version\`). CI runs on the pin — setup-vp is in managed mode and resolves from that file — so the gate above executed on ${node_to} and a failure there would have blocked this. Local checkouts do **not** inherit it: the vp shim is system-first, so the runtime comes from whatever manages Node on each machine. After this merges, install ${node_to} and repoint your default, or your pre-push gate keeps silently running ${node_from} while CI runs ${node_to}."
  fi
  deps_commit="$(git log --format=%H --grep='^build(deps): refresh the toolchain' -1)"
  extra=""
  [[ -n "$deps_commit" ]] && extra="$(git log --format='- %s' "${deps_commit}..HEAD")"
  if [[ -z "$extra" ]]; then
    impact="Manifests + lockfile only — the catalog, workspace package.json versions, and the pinned \`packageManager\` (pnpm); no source change."
  else
    impact="Manifests + lockfile, **plus the source commits the gate required** to land the bump:

${extra}

Review those separately from the version bumps — they are code, not versions."
  fi
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

Full pre-push quality gate ran against the bumped tree (\`vp check\`, typecheck ×17 workspaces, eslint, Biome, React Doctor, tests). The push only succeeds if it is green.

## Impact Analysis

${impact} No changeset: a dependency/toolchain refresh carries no consumer-facing package change (consistent with prior refreshes). TypeScript held at its pin for a known compatibility issue.${node_note}

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
}

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

# --- resume: finish a run whose push failed the gate --------------------------
# Without this there is no way back in. A gate failure leaves the issue, branch
# and commit in place but no PR, and every re-entry is refused: the run is not
# on $base any more, so the check below rejects it, and there is nothing else
# to invoke. The PR then has to be written by hand, which is how a refresh ends
# up with a description that does not match what the script would have said.
if [[ "$open_pr" == 1 ]]; then
  [[ "$current_branch" =~ ^build/([0-9]+)-deps-refresh$ ]] ||
    die "--open-pr must run from a build/<issue>-deps-refresh branch (on '$current_branch')."
  resume_issue="${BASH_REMATCH[1]}"
  deps_commit="$(git log --format=%H --grep='^build(deps): refresh the toolchain' -1)"
  [[ -n "$deps_commit" ]] || die "no build(deps) commit on '$current_branch' — nothing to open a PR for."
  # The moved list is recovered from the commit the first run already wrote, so
  # the resumed PR quotes the same versions rather than a re-derived guess.
  resume_moved="$(git log -1 --format=%B "$deps_commit" | sed -n '/^Moved:$/,/^$/p' | sed '1d;$d')"
  [[ -n "$resume_moved" ]] || resume_moved="(see the pnpm-workspace.yaml / package.json diff)"
  if [[ -n "$(gh pr list --head "$current_branch" --json number --jq '.[].number')" ]]; then
    die "a PR already exists for '$current_branch' — nothing to open."
  fi
  log "Pushing '$current_branch' (the pre-push gate runs again)"
  git push -q -u origin "$current_branch" ||
    die "push still failing — fix the gate findings on '$current_branch', then re-run with --open-pr."
  log "Opening the PR"
  open_the_pr "$resume_issue" "$current_branch" "$resume_moved"
  log "Done. Review the PR above and merge when the checks are green."
  exit 0
fi

[[ "$current_branch" == "$base" ]] || die "run from '$base' (on '$current_branch'). Dependency refreshes branch off $base."

# This script branches wherever it is invoked, so running it in the shared clone
# moves HEAD under every other agent there — the failure docs/coordination
# exists to stop (#385). A linked worktree has `.git` as a FILE; the primary
# checkout has it as a directory.
# `--force` is required, not optional: the shared clone normally HAS $base
# checked out, and git refuses a second worktree on a checked-out branch
# ("fatal: '$base' is already used by worktree at ..."). Forcing is safe here
# because the very next thing this script does is branch off it, so the two
# checkouts never diverge on $base itself.
[[ -d "$REPO_ROOT/.git" ]] && die "run this from a worktree, not the shared clone — it branches in place and would move HEAD for every other agent here. Make one with: git worktree add --force ../vrc-deps $base"
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

# Read BEFORE taze runs. taze rewrites `packageManager` too, so a read taken
# after it can never differ from the final value — which is what made the
# move-detection below unreachable for as long as the header claimed otherwise.
# Matches the whole value, hash included; `pnpm@[0-9.]*` stops at the `+`.
package_manager_pin() {
  sed -nE 's/.*"packageManager": *"([^"]+)".*/\1/p' package.json | head -1
}
pnpm_before="$(package_manager_pin || true)"

log "Updating the pnpm catalog + package.json versions (taze), holding ${EXCLUDE[*]}"
taze_log="$(mktemp)"
trap 'rm -f "$taze_log"' EXIT
npx --yes taze@latest -r --write "${taze_exclude[@]}" | tee "$taze_log"

# The `packageManager` field is written TWICE here, and neither writer's exit
# code describes what it ends up holding. taze (above) moves the version and
# writes it BARE — `pnpm@11.23.0`, no hash. corepack adds the `+sha…`, and that
# hash is the whole supply-chain guarantee on the pin.
#
# So corepack's status is context, not a verdict. It can exit non-zero AFTER
# completing its write: the distro corepack Node 26 leaves on PATH installs
# pnpm, rewrites the field, then dies launching it (#927). Announcing "continuing
# with the current pnpm" on that exit — which is what this used to do — states
# the opposite of what happened. The dangerous inverse is a corepack that dies
# BEFORE its write, leaving taze's bare version: the version still moved, so
# every version-based check reads a clean refresh while the pin has silently
# lost its integrity half. The guard below is what refuses that.
log "Updating pnpm itself (the pinned packageManager) to the latest release"
corepack_failed=()
"$corepack_global" use pnpm@latest || corepack_failed=(--corepack-failed)
# No `pnpm_after` here on purpose: the guard reads the manifest itself, so there
# is one reader of the field rather than two that can disagree.
node scripts/verify-package-manager-pin.mjs --before "$pnpm_before" "${corepack_failed[@]}" ||
  die "the packageManager pin lost its integrity hash — see above. The working tree holds the half-finished refresh; no issue, branch or commit was made."

log "Reinstalling with the refreshed versions (vp install)"
"$vp_global" install

# --- did anything actually change? A no-op day makes no issue/branch/PR --------
# The lockfile counts here, not only the manifests. `pnpm clean --lockfile` above
# regenerates from nothing, which drops resolutions no manifest reaches any more —
# the stale-dependency cleanup that step exists for. This used to revert the
# lockfile whenever no version moved, on the theory that pnpm reformats it with no
# version delta and that churn would open an empty PR. It does not: regeneration
# is idempotent, so a clean lockfile regenerates byte-identical and a diff here is
# always a real resolution change. Reverting discarded the cleanup on every
# already-current day, which is how 127 orphaned peer-suffix entries survived.
if git diff --quiet -- pnpm-workspace.yaml pnpm-lock.yaml '**/package.json'; then
  log "Dependencies already current and the lockfile regenerated identically — nothing to do"
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
# No dedicated packageManager line: taze reports the pnpm move in its own log,
# which the grep above already picks up, so adding one printed it twice. The part
# taze's line cannot show — whether the integrity hash survived — is a hard guard
# above rather than a sentence here.
# A run can now land with no version moved at all — the lockfile alone changed,
# because regenerating it from nothing dropped resolutions nothing reaches. Say so
# rather than pointing at a manifest diff that is empty.
if [[ -z "$moved" ]]; then
  if git diff --quiet -- pnpm-workspace.yaml '**/package.json'; then
    moved="(no version moved — the regenerated lockfile dropped resolutions no manifest reaches)"
  else
    moved="(see the pnpm-workspace.yaml / package.json diff)"
  fi
fi

log "Opening the tracking issue"
issue_body="$(cat <<'BODY'
## 1. Problem Statement

Routine dependency currency: the pnpm catalog and package.json versions drift behind upstream. Left alone, the gap grows into a large, risky upgrade.

## 2. Objective / Desired Outcome

Refresh all dependencies to their latest in-range versions (TypeScript held for a known compatibility issue), verified by the quality gate, landed as one small build(deps) PR.

## 3. Context & Background

Opened by `vp run deps:refresh` (scripts/deps-refresh.sh): vp upgrade → pnpm clean → taze → corepack use pnpm@latest → vp install, then this issue + branch + PR. Manifests + lockfile, and the `.node-version` pin when taze moves it; no source change expected.

## 4. Reproduction Steps

Not a bug — routine maintenance.

## 5. Scope Definition

### In Scope

- Version bumps in `pnpm-workspace.yaml` (catalog) and workspace `package.json` files, plus the regenerated `pnpm-lock.yaml`.
- The `.node-version` pin, when taze moves it. CI runs on that pin, so the gate verifies the new runtime; local machines do not inherit it and must install it.

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

# Same reasoning as the PR callout: a Node move is stated, not listed among the
# versions. HEAD is still the base commit here, so it holds the pin taze replaced.
node_footer="Manifests + lockfile only; verified by the pre-push quality gate."
node_old="$(git show HEAD:.node-version 2>/dev/null || true)"
node_new="$(cat .node-version 2>/dev/null || true)"
node_old="${node_old//[[:space:]]/}"
node_new="${node_new//[[:space:]]/}"
if [[ -n "$node_new" && -n "$node_old" && "$node_old" != "$node_new" ]]; then
  node_footer="The Node pin moves with this: ${node_old} → ${node_new} (.node-version).
CI resolves the runtime from that file, so the gate ran on ${node_new}. Local
checkouts do NOT inherit it — install ${node_new} and repoint your default, or
your pre-push gate keeps running ${node_old} while CI runs ${node_new}.

Manifests, lockfile and the Node pin; verified by the pre-push quality gate."
fi

git commit -q -F - <<COMMIT
build(deps): refresh the toolchain and dependencies

Refresh everything updatable via \`vp run deps:refresh\`: the vp CLI, pnpm
(the pinned \`packageManager\`), and the pnpm catalog + workspace
package.json versions to their latest in-range releases (taze, which also
bumps the \`vite-plus\` dep and its bundled vite/rolldown/vitest/oxlint).
TypeScript is held at its pinned version for a known compatibility issue.

Moved:
${moved}

${node_footer}
COMMIT

log "Pushing (the pre-push hook runs the full quality gate; a failure stops here)"
git push -q -u origin "$branch" ||
  die "push failed — most likely the quality gate. The branch '$branch' holds the change and issue #${issue} is open.
  Fix the findings, commit them on '$branch', then finish the run with:
    vp run deps:refresh -- --open-pr
  (Do NOT re-run the full refresh: it would open a second issue and branch.)"

log "Opening the PR"
open_the_pr "$issue" "$branch" "$moved"

log "Done. Review the PR above and merge when the checks are green."
