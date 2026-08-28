---
name: quality-gate-workflow
description: Post-change validation workflow for Vite+ projects. Use when finishing any code change, when validating work before a PR or merge, or when a change needs formatting, linting, type-safety, and test verification before being considered done.
user-invocable: true
allowed-tools: Bash(vp:*)
---

# Quality Gate Workflow

This skill defines the mandatory validation sequence after code changes.

## When to Apply

- After any code change (feature, refactor, bugfix)
- Before opening or updating a PR
- Before merge
- During regression triage when behavior changed unexpectedly

## References

| Reference                      | Use When                                                                   |
| ------------------------------ | -------------------------------------------------------------------------- |
| `references/daily-practice.md` | Running the quality gate quickly and consistently during daily development |

## Canonical Gate Order

> **Default working directory: the workspace whose files changed.** `vp check`
> and `vp run typecheck` resolve per workspace. From the repo root,
> `vp run check:safe` chains the entire gate the way CI does. `apps/showcase/`
> is an example of a workspace, not the implicit default.
>
> **Stages 4, 5 and 8 are the exceptions** — all three are root-only passes and
> are marked as such below. `cd` to the repo root for those, then come back.
> Running one from inside a workspace is not the gate.

1. `vp fmt .`
2. `vp lint .` — Oxlint
3. `vp run lint:eslint:check` — the eslint custom-rules pass (`--fix` variant: `vp run lint:eslint`)
4. `vp run lint:biome:check` — the Biome pass (`--write` variant: `vp run lint:biome`) — **run from the repo root**
5. `vp run react-doctor:verify` — the React Doctor gate — **run from the repo root**
6. `vp check` — fmt + Oxlint + the **tsgolint** type pass
7. `vp run typecheck` — the real **tsc** pass (plus `check:public-api` in `packages/ui`)
8. `vp run test:changed` — **run from the repo root**

Use this exact order because each stage catches issues earlier/cheaper than the next.

**Stage 3 is not optional and is not covered by stage 6.** `vp check` is Vite+'s
built-in fmt + **Oxlint** + tsgolint; it does not know about the per-workspace
eslint pass. Every eslint-only rule set lives behind stage 3 — `perfectionist`
import/module ordering, the react/stylex rule sets, and `local-rules`. Running
only `vp lint .` will report clean on code that fails CI, which now runs
`vp run -r lint:eslint:check` as its own step.

**Stage 4 is not covered by stage 6 either, and it is root-only.** `vp check` does
not run Biome. Unlike stages 2 and 3 there is no per-workspace variant: `biome.jsonc`
lives at the repo root and its `overrides` scope the react domain to the React
workspaces that exist (`apps/showcase`, `packages/ui`), so one
repo-wide pass covers everything. `cd` to the root for this stage, then come back.
Biome is the only linter here carrying the React-domain rules the other two miss
(`noNestedComponentDefinitions`, `noDuplicatedSpreadProps`). CI runs
`vp run lint:biome:check` as its own step, and the pre-commit hook runs Biome on
staged files via the `staged` block in the root `vite.config.ts`.

**Stage 5 is a gate no linter in this list contains, and it blocks.** React Doctor
is the only pass checking effect cleanup, server/client boundaries and render-path
cost, so nothing in stages 2–4 or 6 will surface what it finds; its errors block
the gate ([ADR-055](../../../docs/decisions/ADR-055-react-doctor-as-a-gate.md)). Like
Biome it is **root-only and repo-wide** — there is no per-workspace variant, so
`cd` to the root for this stage. It writes `reports/react-doctor/full-latest.json`
as it goes, which means the warnings behind a passing run are readable without
paying for a second scan.

When stage 5 fails, read
[`docs/agents/react-doctor-triage.md`](../../../docs/agents/react-doctor-triage.md)
**before** reaching for a suppression. It records which findings have already been
argued, and corrects the belief that React Doctor offers no suppression mechanism —
it has both `ignore.overrides` and `react-doctor-disable` comments, and
`scripts/lib/suppressions-react-doctor.mjs` polices them, so reaching for one is
not a quiet exit.

**Stage 7 is not optional and is not covered by stage 6 either.** Stage 6's type
pass is tsgolint — Oxlint's type-aware path. It reads each workspace's own
strict `tsconfig.app.json`, so it is a genuine type-check, but it is not `tsc`
and it never runs the workspace's `typecheck` script. That script is where
`packages/ui` enforces `check:public-api` (its guard against server-only `node:*`
imports reaching the public API) and where the React Router apps regenerate route
types before checking. CI runs `vp run typecheck:all` as its own step in
`check-safe.yml`. From the root, `vp run typecheck:all` covers every workspace
in dependency order — the run prints them, and COMMANDS.md §5 lists them under a
gate that keeps the count honest.

**Stage 8 is root-only because not everything that has tests is in a workspace.**
`vp run test` resolves per workspace, and root `scripts/` — every verify gate,
report generator and their `lib/` modules — is in none of them, so editing a
tooling script and running the workspace's suite executes not one of its tests
and reports green. `vp run test:changed` selects the affected workspaces and their dependents **and**
adds the root `test:scripts` group when a `.mjs`/`.cjs` under `scripts/` changed,
so it cannot miss either half. **It reads untracked files too**, not only the
tracked diff — this stage runs before a commit, and a new component with a new
colocated test is untracked at that moment; `scripts/changed-files.sh` adds
`git ls-files --others --exclude-standard` for exactly that case, so nothing has
to be `git add`ed first. It prints what it selected and what it skipped; check
that line rather than assuming. To run one half directly:
`vp run test` inside a workspace, `vp run test:scripts` from the root. CI reaches
both halves by either of two paths, chosen by event in `check-safe.yml`'s Unit
Tests job: `vp run test:changed -- --ci` on a pull request, `vp run test:ci` on a
push to `main`. Locally, `vp run check:safe` chains `vp run test:all`
(`vp run -r test` plus `test:scripts`); CI runs neither of those two.

Shortcut: `vp run lint` in a workspace chains `vp lint . --fix` **and**
`vp run lint:eslint` (autofix for both), which is usually what you want while
iterating — but it does **not** include Biome or React Doctor, so stages 4 and 5
still need their own runs. `vp run lint:all` does **not** close that gap either:
it chains the three _linters_ with autofix (`vp lint . --fix`, `lint:eslint`,
`lint:biome`) and stops there, so stage 5 is still unrun after it. The only
shortcut that covers every stage is `vp run check:safe`, which chains the entire
gate the way CI does.

## Documentation Update Rule

Once the gate is green, update the **canonical** doc the change affected — **in
the same commit as the code**. One home per fact
([`docs/README.md`](../../../docs/README.md);
[ADR-088](../../../docs/decisions/ADR-088-keep-living-architecture-docs-on-systems-not-on-every-folder.md)).
Do not copy the same fact into an architecture file, a JSDoc essay, and an ADR.

- **New artifact created, enhanced, or renamed** → one sentence in the owning
  workspace's `INVENTORY.md` (`packages/ui/src/`, `packages/server/src/`,
  `apps/showcase/src/`, …).
- **New or changed command** → [`COMMANDS.md`](../../../COMMANDS.md) in the
  same commit (`vp run commands:verify` fails a miss).
- **New naming/structural convention** → `packages/ui/src/PATTERNS.md` and the
  matching `.claude/rules/` file.
- **New architectural decision** → a new ADR (see below).
- **System wiring changed** — data flow, store ownership, a constraint the
  code cannot say — → that **system's** `ARCHITECTURE.md` (Table, Form, the
  query builders). Not a Props table, not a file tree, not a mermaid of the
  function body, and not a new file because a folder is new.
- **A trap, a measurement, or a why** → **not a comment.** No comment sits above
  a function or component declaration and no prose sits inside its body
  ([ADR-094](../../../docs/decisions/ADR-094-move-explanations-out-of-functions-and-into-the-record-that-owns-them.md)).
  A decision goes in the ADR that owns it; investigation and measurement go in
  the pull request or the issue. Two exemptions: the short file-level "why"
  header on a script, in
  [`.claude/rules/scripts.md`](../../../.claude/rules/scripts.md), and JSDoc a
  build reads (`@param`, `@returns`, …) — the annotations, not prose sharing
  their block.

### Where a new ADR goes

There is **one** ADR home, `docs/decisions/`, on one number sequence
([`docs/README.md`](../../../docs/README.md)), and
[ADR-048](../../../docs/decisions/ADR-048-adr-taxonomy-and-one-sequence.md) owns
the taxonomy — read it rather than a summary here, so this does not become
another place it is written down. Two other homes existed and are gone.

The one mechanic you need at gate time: take the number `vp run adr:verify`
reports as free. That gate fails a stray, a reused number, a malformed name and
a stale index.

The ADR file is the whole change. A home's `README.md` carries no row per ADR, so
there is no index to regenerate and — the point of it — no file for a second ADR
branch to conflict with
([ADR-075](../../../docs/decisions/ADR-075-the-index-does-not-list-the-adrs.md)).
`vp run adr:list` prints the ADRs with their titles.

## Non-Negotiable Rules

- Do not skip a stage.
- Fix failures before moving forward.
- Re-run the full gate after non-trivial fixes.
- Prefer `vp run test` (not `vp test`) in this project.
- Never silence a finding to get a stage green (CLAUDE.md rule 11) — fix the code.
  This covers `// biome-ignore` exactly as it covers `// eslint-disable`.
- Never trust a green Biome run on a rule you just enabled — a disabled rule and
  correct code report identically. Confirm with a deliberate violation first.

## Further Documentation

See `references/daily-practice.md` for command intent, failure triage, and time-saving loops.
