---
name: commit-and-pr
description: Write commit messages and PR descriptions that pass the repo's enforced standard. Use before committing, or before opening/updating a pull request, in this Vite+ monorepo.
user-invocable: true
allowed-tools: Bash(vp:*)
---

# Commit & PR Standards

Every commit and every pull request in this repo follows one format, and it is
**enforced** — a local `commit-msg` git hook plus a blocking CI gate
(`pr-standards.yml`). Both derive from a single spec,
[`packages/repo-standards/scripts/commit-convention.mjs`](../../../packages/repo-standards/scripts/commit-convention.mjs),
so this skill never restates the rules that file owns — it tells you how to
satisfy them.

## When to Apply

- Before writing any commit message.
- Before opening or updating a pull request (title **and** description).
- When writing the **prose** inside a PR or issue body: the
  [`unslop`](../unslop/SKILL.md) skill. Headings and commit subjects stay
  spelled as this skill and the templates require. Unslop the sentences
  inside, not the headings.
- When a commit or the `pr-standards` check fails and you need to fix it.
- **After a review lands on your PR** — see **After review** below. A green gate
  is not a mergeable pull request.

## Commit messages — Conventional Commits

Format: **`type(scope): subject`**

- **type** — one of the allowed types (see `ALLOWED_TYPES` in the spec:
  `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `perf`, `ci`, `build`,
  `revert`, `style`). Lowercase.
- **scope** _(optional but preferred)_ — the workspace you touched, by its
  directory name: `ui`, `admin_system`, `api-server`, `scan-orchestrator`,
  `server`, … (derived automatically from `pnpm-workspace.yaml`), or a
  cross-cutting area: `ci`, `docs`, `tooling`, `deps`, `coordination`, …. A
  sub-path like `ui/table` is fine. An unrecognised scope only **warns** — it
  never blocks.
- **`!`** before the colon marks a breaking change: `refactor(ui)!: …`.
- **subject** — imperative, no trailing period, ≤ 72 chars ideal (100 hard cap).

Examples:

```
feat(ui): add column resize handles
fix(api-server): guard against null rows in the loader
refactor(ui)!: rename ColumnGroupsState to PinnedColumnPartitionState
chore(coordination): close the commit-pr-standards task
docs(agents): document the commit-msg hook
```

Merge, `Revert "…"`, and `fixup!`/`squash!` messages are skipped automatically —
you never hand-format those. The `Co-Authored-By:` trailer and `BREAKING CHANGE:`
footers are always accepted; only the first line is checked.

Self-check before committing:

```bash
printf 'feat(ui): my subject\n' | vp run commit:verify -- -
```

## Pull requests

- **Title** — same Conventional-Commit format as a commit (`type(scope): subject`).
  It is the human-facing summary and the squash-fallback subject.
- **Description** — fill in [`.github/pull_request_template.md`](../../pull_request_template.md).
  The **`## What`** and **`## Verification`** (or `## Testing`) sections are
  **required**; the check fails without them. Keep `## Why` and `## Notes` when
  they add signal. The `🤖 Generated with Claude Code` footer is neither required
  nor rejected. Run [`unslop`](../unslop/SKILL.md) on the sentences inside those
  sections. Do not rewrite the headings.

Self-check before opening/updating a PR:

```bash
PR_TITLE='feat(ci): add pr standards gate' \
  vp run pr:verify -- --body-file my-pr-body.md
```

## After review

Once a reviewer — human, Copilot, or another agent — has commented, the pull
request is blocked until **every thread is addressed and resolved**. The `main`
ruleset enforces it and reports it only in the merge box, so a finished-looking
PR with green checks can sit blocked indefinitely.

```bash
vp run pr:threads                              # exits non-zero while any is open
vp run pr:threads -- --resolve <thread-id>     # after you have fixed or answered it
```

Each thread ends with a fix that names its commit, or a reply refuting the
finding with a probe someone else can re-run — then it is resolved. `outdated`
is not resolution. Note that the ruleset requires **zero** approving reviews, so
if a PR will not merge, an approval is almost never what it is waiting for.

The full rule, and why it is a rule, is
[`docs/agents/pr-review-threads.md`](../../../docs/agents/pr-review-threads.md).

## How it is enforced

| Layer     | What runs                                                                            |
| --------- | ------------------------------------------------------------------------------------ |
| Local     | `.vite-hooks/commit-msg` → `commit:verify` on every `git commit`                     |
| Local     | `.vite-hooks/pre-push` → `branch:verify` on the head ref                             |
| CI (gate) | `pr-standards.yml` → `pr:verify` (title + body) + `commit:verify` per commit         |
| Ruleset   | `required_review_thread_resolution` on `main`, reported by `Review threads resolved` |

Per **Rule 11**, do not work around a failure by weakening the check — fix the
message or the description. The spec (`packages/repo-standards/scripts/commit-convention.mjs`) is the
one place the rules live; change it there if the standard itself must change, and
the hook, CI, and this skill stay in sync.

## Details

Two layers, so a mixed crew of agents and humans follows it without exception.

**Commit messages** are Conventional Commits — `type(scope): subject`. The `type`
is one of the spec's `ALLOWED_TYPES`; the `scope` is preferably the workspace you
touched (`ui`, `admin_system`, `api-server`, … — derived from
`pnpm-workspace.yaml`, so it self-updates) or a cross-cutting area (`ci`, `docs`,
`tooling`, …). An unrecognised scope only **warns**; a malformed header **fails**.
Merge/revert/`fixup!` messages are skipped, and the `Co-Authored-By:` trailer is
always accepted.

**Pull requests** need a conforming title (same format) and a description with
every section in
[`.github/pull_request_template.md`](../../pull_request_template.md): `## What`,
`## Why`, `## Verification` (or `## Testing`), `## Impact Analysis`,
`## Test Coverage`, `## Documentation Updates`. CI's
[`pr-standards.yml`](../../workflows/pr-standards.yml) runs `pr:verify` on the
title + body, `branch:verify` on the head ref, and `commit:verify` over every
non-merge commit in the range, so nothing that skipped the local hook
(`--no-verify`) reaches `main`.

**Branch names** are `<type>/<issue-number>-<kebab-description>` —
`feat/123-add-column-resize`. The `<type>` is the **same** list commits use, so
there is one vocabulary rather than two words for one idea, and the issue number
is what ties a branch to the context that justified it. `main` and `release-*`
are exempt. `.vite-hooks/pre-push` checks it first (a name cannot be fixed after
the push without rewriting the remote), and `vp run coordination:claim` produces
a conforming name for you.

**Issues** need every section in
[`.github/ISSUE_TEMPLATE/standard_issue.md`](../../ISSUE_TEMPLATE/standard_issue.md),
enforced by [`issue-standards.yml`](../../workflows/issue-standards.yml) on open
and edit. This exists because nothing checked issue bodies and the cost was
issues with no reproduction, no scope and no acceptance criteria — which then had
to be investigated from scratch before anyone could act on them. Tracking issues
from `coordination:claim` are **not** exempt; the script fills the template in
instead.

**The templates themselves** — issue, PR, and the merge checklist — are collected
in [`docs/agents/workflow.md`](../../../docs/agents/workflow.md), the entry point
for how agents file, review and merge work. Every PR section is required; write
"None" rather than deleting a heading, so a reviewer can tell a considered no
from an omission. The section headings are matched as **headings** and must keep
their plain spelling — numbering or emoji in one fails `pr:verify`, and a
substring check would have accepted prose that answers none of them. The source
specification is
[`docs/agents/templates-spec.md`](../../../docs/agents/templates-spec.md); it
records the two deviations taken when adopting it, so nobody "restores" the spec
text and breaks the gate.
