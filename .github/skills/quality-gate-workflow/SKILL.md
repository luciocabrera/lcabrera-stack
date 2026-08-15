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

> **Default working directory: `apps/react-router/`.** `vp run test`, `vp check` and
> `vp run typecheck` resolve per workspace, so running them from the monorepo root
> checks something other than the workspace you changed.
>
> **Stages 4 and 5 are the exceptions** — both are root-only, repo-wide passes and
> are marked as such below. `cd` to the repo root for those two, then come back.
> Running either from inside a workspace is not the gate.

1. `vp fmt .`
2. `vp lint .` — Oxlint
3. `vp run lint:eslint:check` — the eslint custom-rules pass (`--fix` variant: `vp run lint:eslint`)
4. `vp run lint:biome:check` — the Biome pass (`--write` variant: `vp run lint:biome`) — **run from the repo root**
5. `vp run react-doctor:verify` — the React Doctor gate — **run from the repo root**
6. `vp check` — fmt + Oxlint + the **tsgolint** type pass
7. `vp run typecheck` — the real **tsc** pass (plus `check:public-api` in `packages/ui`)
8. `vp run test`

Use this exact order because each stage catches issues earlier/cheaper than the next.

**Stage 3 is not optional and is not covered by stage 6.** `vp check` is Vite+'s
built-in fmt + **Oxlint** + tsgolint; it does not know about the per-workspace
eslint pass. Every eslint-only rule set lives behind stage 3 — `perfectionist`
import/module ordering, the react/stylex rule sets, and `local-rules`. Running
only `vp lint .` will report clean on code that fails CI, which now runs
`vp run -r lint:eslint:check` as its own step.

**Stage 4 is not covered by stage 6 either, and it is root-only.** `vp check` does
not run Biome. Unlike stages 2 and 3 there is no per-workspace variant: `biome.jsonc`
lives at the repo root and its `overrides` scope the react domain to the three React
workspaces (`apps/react-router`, `apps/admin_system`, `packages/ui`), so one
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

Shortcut: `vp run lint` in a workspace chains `vp lint . --fix` **and**
`vp run lint:eslint` (autofix for both), which is usually what you want while
iterating — but it does **not** include Biome or React Doctor, so stages 4 and 5
still need their own runs. `vp run lint:all` does **not** close that gap either:
it chains the three _linters_ with autofix (`vp lint . --fix`, `lint:eslint`,
`lint:biome`) and stops there, so stage 5 is still unrun after it. The only
shortcut that covers every stage is `vp run check:safe`, which chains the entire
gate the way CI does.

## Documentation Update Rule

Once the gate is green, update every doc the change affected — **in the same
commit as the code**:

- **Props added/removed** → update the Props table in the component's `ARCHITECTURE.md`.
- **Render flow changed** → update the relevant Mermaid diagram.
- **New hook/util introduced** → add it to the parent directory `ARCHITECTURE.md` and create its own if the directory is new.
- **Type added/changed** → update the `ARCHITECTURE.md` of the directory that owns the type.
- **New dependency added** → update the Dependencies diagram in the affected `ARCHITECTURE.md`.
- **New naming/structural convention established** → update `packages/ui/src/PATTERNS.md` and the matching `.claude/rules/` file.
- **New architectural decision made** → add a new ADR (see below).
- **New artifact created or existing artifact enhanced/renamed** → update the relevant row in the owning workspace's `INVENTORY.md` (`packages/ui/src/`, `packages/server/src/`, `apps/react-router/src/`, …).

### Where a new ADR goes

There are three ADR homes on **one** number sequence, and
[ADR-048](../../../docs/decisions/ADR-048-adr-taxonomy-and-one-sequence.md) owns
the rule for picking between them — read it rather than a summary here, so this
does not become a fourth place the taxonomy is written down.

The one mechanic you need at gate time: take the number `vp run adr:verify`
reports as free (it is global across all three homes, whichever you are writing
in). That gate fails a stray, a reused number, a malformed name and a stale
index.

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
