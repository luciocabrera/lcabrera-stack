# Where does X live? — the documentation map

This repo keeps its knowledge in several places on purpose, each with a different
job. The rule that keeps them from rotting into each other:

> **One canonical home per fact. Everything else _links_ to it — never copies it.**
> A copy is a copy nobody updates. When two docs would say the same thing, one
> states it and the other points.

Start here when you're not sure where something belongs, or where to look.

---

## By question

| You want to know…                                                                | Canonical home                                                                                                                                                                                                               |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **The rules** — TS/React/StyleX standards, the non-negotiables, the quality gate | [`AGENTS.md`](../AGENTS.md) (+ path-scoped [`.claude/rules/`](../.claude/rules/))                                                                                                                                            |
| **How to run something** — every `vp` command, what CI runs                      | [`COMMANDS.md`](../COMMANDS.md)                                                                                                                                                                                              |
| **Why a thing is built the way it is** — an architectural decision               | an **ADR** (two namespaces — see the warning below)                                                                                                                                                                          |
| **Who's working on what right now** — in-flight work, owners, area locks         | [`docs/coordination/`](./coordination/README.md) — the task register (`tasks/*.md`); `vp run coordination:board` renders a local table view                                                                                  |
| **The durable backlog** — what should happen next, epics, milestones             | GitHub **Issues / sub-issues / Milestones / Projects**; boundary vs. the register in [ADR-036](./cqms/decisions/ADR-036-github-planning-layer.md), runbook [`docs/tooling/github-planning.md`](./tooling/github-planning.md) |
| **What's built vs. specified for CQMS/CodePulse**                                | [`docs/cqms/STATUS.md`](./cqms/STATUS.md) — the living page; start there                                                                                                                                                     |
| **The CQMS product spec** (canonical requirements)                               | [`docs/cqms/PRD_V2.md`](./cqms/PRD_V2.md)                                                                                                                                                                                    |
| **Planned-but-unbuilt work** (approved, deferred)                                | a `docs/cqms/*_PLAN.md` spec, indexed from [STATUS.md §2](./cqms/STATUS.md)                                                                                                                                                  |
| **How one component/hook is wired**                                              | that directory's `ARCHITECTURE.md` (152 of them)                                                                                                                                                                             |
| **Naming / structure / StyleX conventions**                                      | the nearest `PATTERNS.md` (e.g. [`packages/ui/src/PATTERNS.md`](../packages/ui/src/PATTERNS.md))                                                                                                                             |
| **Does an artifact already exist before I build one**                            | the app/package `INVENTORY.md` (react-router, ui, server, admin_system)                                                                                                                                                      |
| **A task workflow** (review, fallow scan, quality gate…)                         | [`.github/skills/`](../.github/skills/) `SKILL.md` files                                                                                                                                                                     |
| **How to write a commit / PR** (the enforced format)                             | the [`commit-and-pr`](../.github/skills/commit-and-pr/SKILL.md) skill; spec in [`scripts/lib/commit-convention.mjs`](../scripts/lib/commit-convention.mjs)                                                                   |
| **What changed / release notes**                                                 | [`CHANGELOG.md`](../CHANGELOG.md) — generated by `vp run changelog:generate`; never hand-edited                                                                                                                              |
| **How to file an issue or PR, and the bar for merging**                          | [`docs/agents/`](./agents/workflow.md) — the templates themselves live where GitHub reads them: `.github/ISSUE_TEMPLATE/`, `.github/pull_request_template.md`                                                                |
| **Toolchain notes** (Vite+, fallow)                                              | [`docs/tooling/`](./tooling/)                                                                                                                                                                                                |

## By document, what it is and its lifetime

| Doc                              | Audience                  | Lifetime             | Canonical for                                      |
| -------------------------------- | ------------------------- | -------------------- | -------------------------------------------------- |
| `AGENTS.md` (+ `.claude/rules/`) | every agent + human       | durable              | universal standards, the gate, the non-negotiables |
| `COMMANDS.md`                    | every agent + human       | durable              | the command surface (CI-verified — see below)      |
| ADRs                             | every agent + human       | durable, append-only | one decision each, with context + consequences     |
| `docs/cqms/STATUS.md`            | CQMS contributors         | living               | built-vs-spec truth; deferrals; live deviations    |
| `docs/cqms/*_PLAN.md`            | whoever resumes that work | until it ships       | one deferred work item's execute-ready spec        |
| `*/ARCHITECTURE.md`              | anyone touching that area | durable              | that unit's data flow, deps, constraints           |
| `INVENTORY.md` / `PATTERNS.md`   | anyone building UI        | durable              | reuse catalog / conventions                        |

`PRD.md`, `PRD_V1.md`, `TECH_SPEC.md`, `IMPLEMENTATION_PLAN.md` under `docs/cqms/`
are **history** — superseded drafts kept for provenance. `STATUS.md` says which.

---

## ⚠️ ADRs live in two namespaces, and the numbers collide

- **Component / app decisions** → [`apps/react-router/docs/decisions/`](../apps/react-router/docs/decisions/)
  (Modal, Tooltip, the store pattern, React Compiler, StyleX, grid interaction…).
  Indexed in [`AGENTS.md`](../AGENTS.md) under "Architecture-First Workflow".
- **CQMS / tooling decisions** → [`docs/cqms/decisions/`](./cqms/decisions/)
  (scanner split, migrations, the Biome linter, snapshot pinning…).

**`ADR-011` means two different things depending on the directory** (grid
interaction vs. agent-runner). Always cite an ADR with its path or topic, never
the bare number. Same trap exists for "Phase 2" — see STATUS.md §1.

---

## The two other surfaces (not in this repo)

Two knowledge stores live outside git and are **invisible to other agents and to
humans** — anything that must be shared or coordinated has to be written into the
repo docs above, not left in these:

- **Agent auto-memory** (`~/.claude/projects/<project>/memory/`) — one agent's
  cross-session notes. Kept deliberately thin: a pointer into the repo docs above
  plus genuinely personal context (a user preference, a gotcha too small for an
  ADR). If a memory starts restating a repo doc, the repo doc is canonical and the
  memory should shrink to a link.
- **Plans** (`~/.claude/plans/`) — one agent's scratch for one task. Ephemeral.
  When a plan yields a durable decision or spec, it **graduates** into the repo
  (an ADR, a STATUS entry, or a `*_PLAN.md`) — the way `BIOME_SCANNER_PLAN.md`
  did — and the scratch file is then disposable. A plan's _claim_ (who's on it,
  which files) graduates to the in-git work register at
  [`docs/coordination/`](./coordination/README.md), so parallel agents can see it;
  the old opaque scratch names are catalogued in
  [`PLAN_TRIAGE.md`](./coordination/PLAN_TRIAGE.md).

---

## Hygiene (how this stays true)

- **Update the canonical doc in the same commit as the change that moves it.**
  STATUS.md and COMMANDS.md both say this at the top; it applies to every doc here.
- **`COMMANDS.md` is machine-checked.** `vp run commands:verify` (CI, via
  `check:safe`) fails the build if a documented command doesn't resolve or a real
  script is undocumented. It cannot check prose — so prose still needs care.
- **A new decision gets an ADR** in the right namespace, added to the index in
  `AGENTS.md`.
- **A new artifact** gets an `INVENTORY.md` row; a **new convention**, a
  `PATTERNS.md` entry; a **new area**, its own `ARCHITECTURE.md`.
- When in doubt, prefer **linking over restating.** The link cannot go stale in a
  way the target doesn't; a paraphrase can.
