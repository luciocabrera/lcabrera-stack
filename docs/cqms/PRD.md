# Code Quality Management System (CQMS) — PRD

> **⚠️ Superseded (2026-07-11):** the canonical product definition is now
> [PRD_V2.md](./PRD_V2.md) (CodePulse). This initial Phase-1 draft is kept
> for history; its local-paths-only and no-auth stances are explicitly
> reversed by PRD v2 (see the
> [alignment review](./reviews/2026-07-11-codepulse-alignment-review.md)).

See also: [TECH_SPEC.md](./TECH_SPEC.md), [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md), decisions in [decisions/](./decisions/).

## Context

Today, three scan tools exist in this repo (`fallow-code-checker`, `code-smell-checker`, `code-smell-zen`) but nothing persists their output anywhere — every run's findings live only in a `.tmp/` folder until the next `git clean`. There's no way to see whether code quality is improving or regressing over time, no central place to browse past runs, and no way to trigger a scan without opening a Claude Code session. This project wires the three (soon four, adding a linter skill) scanners into a shared Postgres persistence layer and a new internal admin UI in `apps/admin_system`, so scan history becomes a queryable, browsable asset instead of disposable terminal output.

## Locked-in decisions

Confirmed during planning (not up for re-debate without a new ADR):

1. **Shared UI**: extract a new `packages/ui` workspace package (no existing mechanism let `admin_system` consume `apps/react-router`'s components — verified, not assumed).
2. **Non-deterministic scanners**: UI-triggered runs of `code-smell-checker`/`code-smell-zen` (and `fallow-code-checker`'s triage step) go through a real Claude Agent SDK session server-side, driven by the actual `SKILL.md` file — not a hand-rolled prompt copy. The new linter skill is an exception (see TECH_SPEC §2.5) — it needs no LLM involvement at all.
3. **Async execution**: in-process background job inside `admin_system`'s own Node/SSR process. Status updates push to the UI in real time over a **WebSocket** (not polling). Accepted tradeoff: an in-flight job dies on server restart.
4. **All persistence and API logic for this feature lives entirely in the new project** — `packages/scan-ingestion` + `admin_system`'s own loaders/actions. Unlike `apps/react-router` (which talks to Postgres only through the separate `apps/api-server` BFF), CQMS does not use, call, or modify `apps/api-server` at all.
5. **Primary keys are UUIDs**, not integers, across every CQMS table.
6. **Shared components get extended, not worked around.** Where `Table`/`Card`/`SidePanel`/etc. lack a capability CQMS needs, the fix happens in `packages/ui`, never as a local one-off in `admin_system`.
7. **A new generic `Form` component is added to `packages/ui` alongside `Table`** — same "component knows how to render itself from declarative config" philosophy (`columns` for `Table`, `fields` for `Form`), built on React Router 7's native `<Form>`, with recursive `row`/`tab`/`group` field nesting. CQMS's own `new-project` and `trigger-scan` forms are its first real consumers.
8. **CRUD/rollup logic lives in Postgres** as functions, procedures, and views — the TS layer stays a thin validate-then-call wrapper, not an orchestration layer.
9. **Zod validation stays server-side only.** `Form`'s client-side instant-feedback validation is a separate, hand-rolled (non-Zod) definition — a deliberate choice to avoid adding Zod to the client bundle (see TECH_SPEC §2.10 for the full reasoning).

## Goals

- Persist every scan run (findings + full raw JSON + rendered report) to Postgres.
- One shared ingestion path used by both interactive skill runs and UI-triggered runs — no divergent code paths.
- An internal admin UI to: list runs, drill into a run's scans, read a scan's report (rendered MD), explore its raw JSON **as a table** (not just tree/text), see quality trend over time per project/scanner, and trigger new scans.
- A new deterministic linter skill (oxlint + eslint) added to the scanner roster, mirroring `fallow-code-checker`'s structure.

## Non-goals (Phase 1)

- Dependency graph / symbol usage tracking (Phase 2 — schema must not conflict with adding it later, nothing more).
- Clone-by-URL project registration (local paths only).
- Auth (internal-only tool).
- CI-triggered scans (schema allows for it via `runs.origin = 'ci'`, but nothing builds a CI hook in Phase 1).

## User flows

1. **Register a project** — user enters a name + local absolute path; app verifies the path exists and stores it.
2. **Trigger a scan** — from a project's page, user picks "all scanners" or a specific one; action creates a `queued` run + scans, kicks off the background job, redirects to the run detail page which opens a live status connection.
3. **Watch a run progress** — run detail page shows a **table** of that run's scans (one row per scanner) with status (`queued → running → succeeded/failed`) updating **instantly via WebSocket push**, no refresh or polling delay.
4. **Read a scan's results** — open a scan: rendered Markdown report in one tab, a **table view of the raw JSON** (columns inferred from its structure, with a copy-to-clipboard for the underlying raw text) in another, paginated/filterable findings table in a third.
5. **See quality trend** — a project's trend view shows total errors/warnings/files/clean-count over time per scanner, with an up/down (red/green) indicator, plus the file-type/suffix-category breakdown for the most recent run.
6. **(Documented, not built) Phase 2** — once a run's data model is proven, a per-symbol dependency graph gets layered on top to help an LLM reason about duplication/misplaced exports.
