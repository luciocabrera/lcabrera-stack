# Where does X live? — the documentation map

This repo keeps its knowledge in several places on purpose, each with a different
job. The rule that keeps them from rotting into each other:

> **One canonical home per fact. Everything else _links_ to it — never copies it.**
> A copy is a copy nobody updates. When two docs would say the same thing, one
> states it and the other points.

Start here when you're not sure where something belongs, or where to look.

---

## By question

| You want to know…                                                                | Canonical home                                                                                                                                                                                                        |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **The rules** — TS/React/StyleX standards, the non-negotiables, the quality gate | [`AGENTS.md`](../AGENTS.md) (+ path-scoped [`.claude/rules/`](../.claude/rules/))                                                                                                                                     |
| **How to run something** — every `vp` command, what CI runs                      | [`COMMANDS.md`](../COMMANDS.md)                                                                                                                                                                                       |
| **Why a thing is built the way it is** — an architectural decision               | an **ADR** (three homes, one number sequence — see the warning below)                                                                                                                                                 |
| **Who's working on what right now** — in-flight work, owners, area locks         | [`docs/coordination/`](./coordination/README.md) — the task register (`tasks/*.md`); `vp run coordination:board` renders a local table view                                                                           |
| **The durable backlog** — what should happen next, epics, milestones             | GitHub **Issues / sub-issues / Milestones / Projects**; boundary vs. the register in [ADR-036](decisions/ADR-036-github-planning-layer.md), runbook [`docs/tooling/github-planning.md`](./tooling/github-planning.md) |
| **What's built vs. specified for CQMS/CodePulse**                                | [`docs/cqms/STATUS.md`](./cqms/STATUS.md) — the living page; start there                                                                                                                                              |
| **The CQMS product spec** (canonical requirements)                               | [`docs/cqms/PRD_V2.md`](./cqms/PRD_V2.md)                                                                                                                                                                             |
| **Planned-but-unbuilt work** (approved, deferred)                                | a `docs/cqms/*_PLAN.md` spec, indexed from [STATUS.md §2](./cqms/STATUS.md)                                                                                                                                           |
| **How one component/hook is wired**                                              | that directory's `ARCHITECTURE.md` (`git ls-files "**/ARCHITECTURE.md"` lists them)                                                                                                                                   |
| **Naming / structure / StyleX conventions**                                      | the nearest `PATTERNS.md` (e.g. [`packages/ui/src/PATTERNS.md`](../packages/ui/src/PATTERNS.md))                                                                                                                      |
| **Does an artifact already exist before I build one**                            | the app/package `INVENTORY.md` (react-router, ui, server, admin_system)                                                                                                                                               |
| **Whether to extract shared code into a package or duplicate it**                | [`docs/agents/cross-app-abstraction.md`](./agents/cross-app-abstraction.md) — the decision in order; ADR-038/039/040 own the steps                                                                                    |
| **A task workflow** (review, fallow scan, quality gate…)                         | [`.github/skills/`](../.github/skills/) `SKILL.md` files                                                                                                                                                              |
| **How to write a commit / PR** (the enforced format)                             | the [`commit-and-pr`](../.github/skills/commit-and-pr/SKILL.md) skill; spec in [`scripts/lib/commit-convention.mjs`](../scripts/lib/commit-convention.mjs)                                                            |
| **What a change must prove before it goes up for review**                        | [`docs/agents/refactor-verified-contract.md`](./agents/refactor-verified-contract.md) — the independent-verifier standard; procedure in the [`refactor-verified`](../.github/skills/refactor-verified/SKILL.md) skill |
| **What an agent code review may block a merge for, and how to override it**      | [`docs/agents/agent-review-contract.md`](./agents/agent-review-contract.md) — the verdict schema, the blocking severities, the override path                                                                          |
| **What changed / release notes**                                                 | [`CHANGELOG.md`](../CHANGELOG.md) — generated by `vp run changelog:generate`; never hand-edited                                                                                                                       |
| **How to file an issue or PR, and the bar for merging**                          | [`docs/agents/`](./agents/workflow.md) — the templates themselves live where GitHub reads them: `.github/ISSUE_TEMPLATE/`, `.github/pull_request_template.md`                                                         |
| **Toolchain notes** (Vite+, fallow)                                              | [`docs/tooling/`](./tooling/)                                                                                                                                                                                         |

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

## ADRs: three homes, one number sequence

The home is chosen by **one question — when CQMS moves to its own repository,
does this decision go with it?**
([ADR-048](./decisions/ADR-048-adr-taxonomy-and-one-sequence.md).)

| Home                                                                                 | Holds                                                                   | At extraction |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- | ------------- |
| [`docs/decisions/`](./decisions/README.md)                                           | the repo, the published `@lcabrera/*` packages, the toolchain           | **stays**     |
| [`docs/cqms/decisions/`](./cqms/decisions/README.md)                                 | CQMS / CodePulse — schema, scanners, ingestion, orchestration           | **leaves**    |
| [`apps/react-router/docs/decisions/`](../apps/react-router/docs/decisions/README.md) | the showcase app — Modal, Tooltip, the store pattern, grid interaction… | **stays**     |

Each home's `README.md` is a generated page describing the home; it lists no ADRs
on purpose, because a committed list is one region every ADR branch appends to
([ADR-075](./decisions/ADR-075-the-index-does-not-list-the-adrs.md)). To find one
by title rather than by filename, run `vp run adr:list`.
**A number identifies exactly one ADR**: take the next free one from
`vp run adr:verify`, whichever home you are writing in. Unadopted proposals wait
in [`docs/agents/planning/adr-drafts/`](./agents/planning/adr-drafts/) and hold
**no number** — one is assigned at adoption, never at proposal.

⚠️ **Numbers 001–012 predate the single sequence and each mean two things** —
`ADR-011` is grid interaction _and_ the agent-runner permission model. Cite one of
those by path. They are deliberately not renumbered: an ADR is a dated record.
The same trap exists for "Phase 2" — see STATUS.md §1.

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
