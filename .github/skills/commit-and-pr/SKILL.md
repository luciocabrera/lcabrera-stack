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
[`scripts/lib/commit-convention.mjs`](../../../scripts/lib/commit-convention.mjs),
so this skill never restates the rules that file owns — it tells you how to
satisfy them.

## When to Apply

- Before writing any commit message.
- Before opening or updating a pull request (title **and** description).
- When a commit or the `pr-standards` check fails and you need to fix it.

## Commit messages — Conventional Commits

Format: **`type(scope): subject`**

- **type** — one of the allowed types (see `ALLOWED_TYPES` in the spec:
  `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `perf`, `ci`, `build`,
  `revert`, `style`). Lowercase.
- **scope** _(optional but preferred)_ — the workspace you touched, by its
  directory name: `ui`, `admin_system`, `api-server`, `scan-orchestrator`,
  `data-access`, … (derived automatically from `pnpm-workspace.yaml`), or a
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
  nor rejected.

Self-check before opening/updating a PR:

```bash
PR_TITLE='feat(ci): add pr standards gate' \
  vp run pr:verify -- --body-file my-pr-body.md
```

## How it is enforced

| Layer     | What runs                                                                    |
| --------- | ---------------------------------------------------------------------------- |
| Local     | `.vite-hooks/commit-msg` → `commit:verify` on every `git commit`             |
| CI (gate) | `pr-standards.yml` → `pr:verify` (title + body) + `commit:verify` per commit |

Per **Rule 11**, do not work around a failure by weakening the check — fix the
message or the description. The spec (`scripts/lib/commit-convention.mjs`) is the
one place the rules live; change it there if the standard itself must change, and
the hook, CI, and this skill stay in sync.
