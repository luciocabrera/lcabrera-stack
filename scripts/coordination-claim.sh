#!/usr/bin/env bash
#
# coordination-claim.sh — start coordinated work in one step.
#
# Turns the multi-step "claim before you touch" ceremony (scaffold a task file,
# open a branch, commit, open a draft PR) into one command, so the safe path is
# the easy path. The draft PR makes the claim visible via
# `vp run coordination:board:live` immediately, even before it merges. See
# docs/coordination/README.md.
#
# The task file is committed onto the WORK branch, not onto `main` in a separate
# claim-only PR: `main`'s ruleset would hold the claim behind a green CI run,
# after the moment the lock is meant to precede, and `coordination:verify` reads
# claims off every live branch anyway (ADR-074, #233). Reviewers ask about this,
# so the answer lives here as well as in the README.
#
# Usage:
#   vp run coordination:claim -- <id> "<title>" (--issue <n> | --new-issue)
#                                [--area <glob> ...] [--branch <name>]
#                                [--in-place] [--dry-run]
#
#   <id>         kebab-case task id (== the task filename slug)
#   <title>      one-line human-readable description
#   --issue <n>  link an EXISTING GitHub backlog issue (ADR-036) this work picks up
#   --new-issue  create a fresh tracking issue titled <title> and link it
#   --area       a glob this work OWNS (repeatable; defaults to a TODO placeholder)
#   --type       Conventional-Commit type for the branch (default: chore)
#   --branch     branch name (default: <type>/<issue>-<id>, the enforced shape)
#   --in-place   branch in THIS checkout instead of an isolated worktree. Only
#                safe when nobody else is working in this clone — it moves HEAD
#                for everyone in it, which is the failure the coordination README
#                exists to stop. Default is an isolated ../vrc-<id> worktree;
#                `--worktree` is still accepted and is now a no-op.
#   --dry-run    print every git/gh/file action without performing it
#
# Exactly one of --issue / --new-issue is REQUIRED: every claim links a backlog
# item, and the issue is self-assigned at claim time so its Projects card flips
# to In Progress at the START of the work — not when the branch is later pushed —
# closing the window where another agent could pick up the same issue. The
# `issue:` field this writes is enforced by `coordination:verify` (a claim
# without it fails the gate).
#
# Effects live here (git, gh, fs); schema validation is the existing
# subprocess-free node tooling. BOARD.md is a gitignored local view (ADR-037),
# so the claim commits only the task file; the pre-commit hook formats it.
set -euo pipefail

die() { local msg="$1"; printf 'coordination-claim: %s\n' "$msg" >&2; exit 1; }

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || die "not in a git repo"
cd "$REPO_ROOT"

# Isolation is the DEFAULT: branching in the shared clone moves HEAD under every
# other agent working there, so it must be the thing you ask for, not the thing
# you get by omission (#385).
id=""; title=""; branch=""; worktree=1; dry=0; issue=""; new_issue=0; areas=()
type="chore"
while [[ $# -gt 0 ]]; do
  arg="$1"
  case "$arg" in
    --)          shift ;; # end-of-options separator (e.g. `vp run … -- <id>`)
    --issue)     issue="${2#\#}"; shift 2 ;;
    --new-issue) new_issue=1; shift ;;
    --area)      areas+=("$2"); shift 2 ;;
    --type)      type="$2"; shift 2 ;;
    --branch)    branch="$2"; shift 2 ;;
    --worktree)  worktree=1; shift ;; # now the default; kept so old commands work
    --in-place)  worktree=0; shift ;;
    --dry-run)   dry=1; shift ;;
    -h|--help)   grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    --*)         die "unknown flag: $arg" ;;
    *)           if [[ -z "$id" ]]; then id="$arg";
                 elif [[ -z "$title" ]]; then title="$arg";
                 else die "unexpected arg: $arg"; fi; shift ;;
  esac
done

[[ -n "$id" && -n "$title" ]] || die 'usage: coordination:claim -- <id> "<title>" (--issue <n> | --new-issue) [--area <glob> ...]'
[[ "$id" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]] || die "id must be kebab-case (got '$id')"
# Exactly one issue source — a claim always links a backlog item (ADR-036).
if [[ -n "$issue" && "$new_issue" == 1 ]]; then
  die 'pass either --issue <n> or --new-issue, not both'
elif [[ -z "$issue" && "$new_issue" == 0 ]]; then
  die 'an issue is required: pass --issue <n> to link a backlog item, or --new-issue to create one'
fi
[[ -z "$issue" || "$issue" =~ ^[0-9]+$ ]] || die "--issue must be a number (got '$issue')"
task="docs/coordination/tasks/${id}.md"
[[ -e "$task" ]] && die "task already exists: $task"
# Same vocabulary as commit messages — one word per idea. The list is duplicated
# here because this is bash and the spec is an ES module; scripts/lib/
# commit-convention.test.mjs asserts the two agree, so a divergence fails CI
# rather than surfacing as a rejected push.
case "$type" in
  feat|fix|chore|docs|test|refactor|perf|ci|build|revert|style) ;;
  *) die "--type must be a Conventional-Commit type (got '$type')" ;;
esac
[[ ${#areas[@]} -gt 0 ]] || areas=("TODO/replace-with-your-area/**")
today=$(date +%F)

# run: execute a command, or just print it under --dry-run (no eval — args stay
# an array, so quoting is preserved and nothing is re-parsed by a shell).
run() { if [[ "$dry" == 1 ]]; then printf '  + %s\n' "$*"; else "$@"; fi; }
enter() { local dir="$1"; if [[ "$dry" == 1 ]]; then printf '  + cd %s\n' "$dir"; else cd "$dir"; fi; }

wt_note=""
[[ "$worktree" == 1 ]] && wt_note=" (worktree)"
printf 'Claiming %s\n' "$id"

# 0. resolve the backlog issue (create it when --new-issue) and self-assign it
#    NOW — so its Projects card moves to In Progress at the START of the work,
#    closing the window where another agent could pick up the same issue.

# The body follows .github/ISSUE_TEMPLATE/standard_issue.md, which
# `issue-standards.yml` enforces. A tracking issue used to be one sentence, and
# that is precisely the shape that has to be re-investigated before it can be
# worked — so it is filled in here instead of being exempted from the rule.
issue_body() {
  cat <<BODY
## 1. Problem Statement

${title}

Claimed as coordination task \`${id}\`; the task file
(\`docs/coordination/tasks/${id}.md\`) tracks who owns it and which areas it locks.

## 2. Objective / Desired Outcome

${title} — done, verified by the repo quality gate, with the coordination task
closed and its file deleted.

## 3. Context & Background

Replace this with the background a reader needs six months from now: what led
here, what was tried, which ADR or PR it follows from.

## 4. Reproduction Steps

Not a bug — replace this section if it is one.

## 5. Scope Definition

### In Scope

$(printf -- '- \`%s\`\n' "${areas[@]}")

### Out of Scope

- Anything outside the areas above.

## 6. Acceptance Criteria

- [ ] ${title}
- [ ] No regressions; the quality gate passes
- [ ] Automated tests added or updated where behaviour changed
- [ ] Documentation updated per the rule in AGENTS.md
- [ ] Coordination task closed and its file deleted

## 7. Implementation Notes

Replace with anything the implementer should know before starting.

## 8. Related Work

Coordination task: \`docs/coordination/tasks/${id}.md\`

## 9. Planning Metadata

A tracking issue stands alone until someone links it — fill these in if this work
turns out to sit under an epic. See docs/agents/dependency-conventions.md.

\`\`\`yaml
dependencies:
  blocking: []
  blockedBy: []
  parent: null
  children: []
\`\`\`
BODY
}

if [[ "$new_issue" == 1 ]]; then
  if [[ "$dry" == 1 ]]; then
    printf '  + gh issue create --title "%s" --body <standard template>\n' "$title"
    issue="000"
  else
    issue=$(gh issue create --title "$title" --body "$(issue_body)" \
      | grep -oE '[0-9]+$')
    [[ -n "$issue" ]] || die "could not create the tracking issue"
    printf '  created issue #%s\n' "$issue"
  fi
elif [[ "$dry" == 0 ]]; then
  gh issue view "$issue" --json number >/dev/null 2>&1 ||
    die "issue #$issue not found (pass --new-issue to create one)"
fi
run gh issue edit "$issue" --add-assignee @me

# Branch name is derived HERE, not earlier: it embeds the issue number, which
# does not exist until --new-issue has created it. `<type>/<issue>-<id>` is the
# shape verify-branch-name.mjs enforces on push.
[[ -n "$branch" ]] || branch="${type}/${issue}-${id}"
printf '  branch %s%s\n' "$branch" "$wt_note"

# 1. branch / worktree off the latest main
run git fetch -q origin main
if [[ "$worktree" == 1 ]]; then
  work="../vrc-${id}"
  run git worktree add -q "$work" -b "$branch" origin/main
else
  work="$REPO_ROOT"
  run git checkout -q -b "$branch" origin/main
fi
enter "$work"

# 1b. A worktree starts empty of dependencies. This used to symlink the primary
#     checkout's node_modules, which was faster and silently wrong: the pnpm
#     workspace links inside it still point at the PRIMARY checkout's packages,
#     so `@repo/vite-configs`, `@lcabrera/ui` and friends resolved there while you
#     edited the worktree. Tooling then read code you had not changed — a shared
#     eslint config edit never took effect, and another agent's uncommitted work
#     in the primary tree leaked in, which is the cross-contamination worktrees
#     exist to prevent. It fails silently and only for changes that touch a
#     workspace package, so it hides well. A real install measured 5.4s against a
#     warm pnpm store — a one-off cost at claim time, paid once per worktree.
#     Route types are generated, not committed, so a fresh worktree has none and
#     the first commit would fail on `Cannot find module './+types/root'`.
if [[ "$worktree" == 1 ]]; then
  printf '  installing dependencies + generating route types in the worktree\n'
  run vp install
  run vp run typegen:all
fi

# 2. scaffold the task file (the frontmatter the register validates)
if [[ "$dry" == 1 ]]; then
  printf '  + write %s\n' "$task"
else
  {
    printf -- '---\nid: %s\ntitle: %s\nowner: agent:claude\nstatus: active\n' "$id" "$title"
    printf 'branch: %s\narea:\n' "$branch"
    printf -- '  - %s\n' "${areas[@]}"
    printf 'started: %s\nupdated: %s\nplan: (none)\npr: (none)\nissue: #%s\n---\n\n' "$today" "$today" "$issue"
    printf '## What\n\n%s\n\n## Status / next\n\n- Current step: just claimed\n- Blockers: none\n- Next:\n' "$title"
  } > "$task"
fi

# 3. commit the claim (the pre-commit hook formats the task file), push, and open
#    a draft PR so the claim is immediately visible. BOARD.md is a gitignored
#    local view (ADR-037) — regenerate it any time with `vp run coordination:board`;
#    it is never committed, so there is nothing here for concurrent claims to conflict on.
run git add "$task"
run git commit -q -m "chore(coordination): claim ${id}"
run git push -q -u origin "$branch"
# Every section the PR gate requires, so the claim PR passes its own standard
# from the moment it opens. Replace the placeholders as the work lands.
body="## What

Claims **${id}** — ${title}. Part of #${issue}.

## Why

Opens the claim so the work is visible to other agents via
\`coordination:board:live\` before it starts, rather than at first push.

## Verification

- Draft — work in progress. Replace with the quality-gate evidence before
  flipping to ready.

## Impact Analysis

- Areas locked by this claim: $(printf '\`%s\` ' "${areas[@]}")
- No code changes yet; this commit adds only the task file.

## Test Coverage

None yet — replace before this leaves draft.

## Documentation Updates

None yet — replace before this leaves draft.

## Linked Issues

Resolves #${issue}

## Known Limitations

Draft claim; the sections above are placeholders until the work is done."
run gh pr create --draft --head "$branch" --base main \
  --title "chore(coordination): claim ${id}" --body "$body"

printf '\nClaimed. Work in %s, push often, and flip the draft to ready when done.\n' "$work"

# Env files are gitignored, so a worktree has none. Still deliberately a prompt
# rather than an automatic step: provisioning credentials into a new checkout is
# the user's call, not a side effect of claiming a task. What changed is that the
# call is now one command instead of a manual copy, and it symlinks rather than
# copies, so no second credential lands on disk.
if [[ "$worktree" == 1 ]]; then
  printf 'Anything DB-touching also needs the local env files — they are gitignored, so the worktree starts without them:\n'
  printf '  cd %s && vp run worktree:env\n' "$work"
fi
