#!/usr/bin/env bash
#
# coordination-claim.sh — start coordinated work in one step.
#
# Turns the multi-step "claim before you touch" ceremony (scaffold a task file,
# open a branch, regenerate the board, commit, open a draft PR) into one command,
# so the safe path is the easy path. The draft PR makes the claim visible via
# `vp run coordination:board:live` immediately, even before it merges. See
# docs/coordination/README.md.
#
# Usage:
#   vp run coordination:claim -- <id> "<title>" [--area <glob> ...] [--branch <name>]
#                                [--worktree] [--dry-run]
#
#   <id>        kebab-case task id (== the task filename slug)
#   <title>     one-line human-readable description
#   --area      a glob this work OWNS (repeatable; defaults to a TODO placeholder)
#   --branch    branch name (default: the id)
#   --worktree  work in an isolated ../vrc-<id> git worktree (recommended when
#               other agents are active) instead of switching this checkout
#   --dry-run   print every git/gh/file action without performing it
#
# Effects live here (git, gh, fs); the board regen + schema validation are the
# existing subprocess-free node tooling this calls. The commit's pre-commit hook
# formats the board and task file.
set -euo pipefail

die() { local msg="$1"; printf 'coordination-claim: %s\n' "$msg" >&2; exit 1; }

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || die "not in a git repo"
cd "$REPO_ROOT"

id=""; title=""; branch=""; worktree=0; dry=0; areas=()
while [[ $# -gt 0 ]]; do
  arg="$1"
  case "$arg" in
    --area)     areas+=("$2"); shift 2 ;;
    --branch)   branch="$2"; shift 2 ;;
    --worktree) worktree=1; shift ;;
    --dry-run)  dry=1; shift ;;
    -h|--help)  grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    --*)        die "unknown flag: $arg" ;;
    *)          if [[ -z "$id" ]]; then id="$arg";
                elif [[ -z "$title" ]]; then title="$arg";
                else die "unexpected arg: $arg"; fi; shift ;;
  esac
done

[[ -n "$id" && -n "$title" ]] || die 'usage: coordination:claim -- <id> "<title>" [--area <glob> ...]'
[[ "$id" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]] || die "id must be kebab-case (got '$id')"
task="docs/coordination/tasks/${id}.md"
[[ -e "$task" ]] && die "task already exists: $task"
[[ -n "$branch" ]] || branch="$id"
[[ ${#areas[@]} -gt 0 ]] || areas=("TODO/replace-with-your-area/**")
today=$(date +%F)

# run: execute a command, or just print it under --dry-run (no eval — args stay
# an array, so quoting is preserved and nothing is re-parsed by a shell).
run() { if [[ "$dry" == 1 ]]; then printf '  + %s\n' "$*"; else "$@"; fi; }
enter() { local dir="$1"; if [[ "$dry" == 1 ]]; then printf '  + cd %s\n' "$dir"; else cd "$dir"; fi; }

wt_note=""
[[ "$worktree" == 1 ]] && wt_note=" (worktree)"
printf 'Claiming %s on branch %s%s\n' "$id" "$branch" "$wt_note"

# 1. branch / worktree off the latest main
run git fetch -q origin main
if [[ "$worktree" == 1 ]]; then
  work="../vrc-${id}"
  run git worktree add -q "$work" -b "$branch" origin/main
  # Share the primary checkout's installed deps so vp/vitest work in the worktree.
  run ln -sfn "$REPO_ROOT/node_modules" "$work/node_modules"
  while IFS= read -r ws; do
    [[ -d "$REPO_ROOT/$ws/node_modules" ]] &&
      run ln -sfn "$REPO_ROOT/$ws/node_modules" "$work/$ws/node_modules"
  done < <(git ls-files '*/package.json' | sed 's#/package.json$##' | sort -u)
else
  work="$REPO_ROOT"
  run git checkout -q -b "$branch" origin/main
fi
enter "$work"

# 2. scaffold the task file (the frontmatter the register validates)
if [[ "$dry" == 1 ]]; then
  printf '  + write %s\n' "$task"
else
  {
    printf -- '---\nid: %s\ntitle: %s\nowner: agent:claude\nstatus: active\n' "$id" "$title"
    printf 'branch: %s\narea:\n' "$branch"
    printf -- '  - %s\n' "${areas[@]}"
    printf 'started: %s\nupdated: %s\nplan: (none)\npr: (none)\n---\n\n' "$today" "$today"
    printf '## What\n\n%s\n\n## Status / next\n\n- Current step: just claimed\n- Blockers: none\n- Next:\n' "$title"
  } > "$task"
fi

# 3. regenerate the board, commit the claim (the pre-commit hook formats both),
#    push, and open a draft PR so the claim is immediately visible.
run node scripts/verify-coordination.mjs --write-board
run git add "$task" docs/coordination/BOARD.md
run git commit -q -m "chore(coordination): claim ${id}"
run git push -q -u origin "$branch"
body="## What

Claims **${id}** — ${title}.

## Verification

- Draft — work in progress; this PR opens the claim so it is visible via \`coordination:board:live\`."
run gh pr create --draft --head "$branch" --base main \
  --title "chore(coordination): claim ${id}" --body "$body"

printf '\nClaimed. Work in %s, push often, and flip the draft to ready when done.\n' "$work"
