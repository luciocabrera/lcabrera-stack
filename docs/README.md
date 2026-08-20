# Where does X live? — the documentation map

This repo keeps its knowledge in several places on purpose, each with a different
job. The rule that keeps them from rotting into each other:

> **One canonical home per fact. Everything else _links_ to it — never copies it.**
> A copy is a copy nobody updates. When two docs would say the same thing, one
> states it and the other points.

Start here when you're not sure where something belongs, or where to look.

---

## By question

| You want to know…                                                                | Canonical home                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **The rules** — TS/React/StyleX standards, the non-negotiables, the quality gate | [`AGENTS.md`](../AGENTS.md) (+ path-scoped [`.claude/rules/`](../.claude/rules/))                                                                                                                                                                                                                                                                                                                                                                     |
| **How to run something** — every `vp` command, what CI runs                      | [`COMMANDS.md`](../COMMANDS.md)                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Why a thing is built the way it is** — an architectural decision               | an **ADR** (two homes, one number sequence — see the warning below)                                                                                                                                                                                                                                                                                                                                                                                   |
| **How other projects solved a problem we are deciding** — external research      | [`docs/agents/research/`](./agents/research/) — dated, sourced write-ups that feed an ADR; not plans, which live in [`docs/agents/planning/`](./agents/planning/). Unlike an ADR these are **held to live repo paths** by `docs:verify`: when a path one cites moves, amend above the body rather than rewriting it, and write an external repo's paths so the gate cannot read them as this repo's (`/docs/…`, or prefixed with their own directory) |
| **Who's working on what right now** — in-flight work, owners, area locks         | [`docs/coordination/`](./coordination/README.md) — the task register (`tasks/*.md`); `vp run coordination:board` renders a local table view                                                                                                                                                                                                                                                                                                           |
| **The durable backlog** — what should happen next, epics, milestones             | GitHub **Issues / sub-issues / Milestones / Projects**; boundary vs. the register in [ADR-036](decisions/ADR-036-github-planning-layer.md), runbook [`docs/tooling/github-planning.md`](./tooling/github-planning.md)                                                                                                                                                                                                                                 |
| **How one component/hook is wired**                                              | that directory's `ARCHITECTURE.md` (`git ls-files "**/ARCHITECTURE.md"` lists them)                                                                                                                                                                                                                                                                                                                                                                   |
| **Naming / structure / StyleX conventions**                                      | the nearest `PATTERNS.md` (e.g. [`packages/ui/src/PATTERNS.md`](../packages/ui/src/PATTERNS.md))                                                                                                                                                                                                                                                                                                                                                      |
| **Does an artifact already exist before I build one**                            | the app/package `INVENTORY.md` (react-router, ui, server)                                                                                                                                                                                                                                                                                                                                                                                             |
| **Whether to extract shared code into a package or duplicate it**                | [`docs/agents/cross-app-abstraction.md`](./agents/cross-app-abstraction.md) — the decision in order; ADR-038/039/040 own the steps                                                                                                                                                                                                                                                                                                                    |
| **A task workflow** (review, fallow scan, quality gate…)                         | [`.github/skills/`](../.github/skills/) `SKILL.md` files                                                                                                                                                                                                                                                                                                                                                                                              |
| **How to write a commit / PR** (the enforced format)                             | the [`commit-and-pr`](../.github/skills/commit-and-pr/SKILL.md) skill; spec in [`packages/repo-standards/scripts/commit-convention.mjs`](../packages/repo-standards/scripts/commit-convention.mjs)                                                                                                                                                                                                                                                    |
| **What a change must prove before it goes up for review**                        | [`docs/agents/refactor-verified-contract.md`](./agents/refactor-verified-contract.md) — the independent-verifier standard; procedure in the [`refactor-verified`](../.github/skills/refactor-verified/SKILL.md) skill                                                                                                                                                                                                                                 |
| **What an agent code review may block a merge for, and how to override it**      | [`docs/agents/agent-review-contract.md`](./agents/agent-review-contract.md) — the verdict schema, the blocking severities, the override path                                                                                                                                                                                                                                                                                                          |
| **Whether Copilot has reviewed the head commit, and what to do when it has not** | [`docs/tooling/copilot-review-gate.md`](./tooling/copilot-review-gate.md) — the `Copilot review complete` status, its states, the break-glass path                                                                                                                                                                                                                                                                                                    |
| **Why a review-gate status is stale, and how to recompute it**                   | [`docs/tooling/review-gate-reconcile.md`](./tooling/review-gate-reconcile.md) — the scheduled sweep over both gates, its interval, and the recovery                                                                                                                                                                                                                                                                                                   |
| **What changed / release notes**                                                 | [`CHANGELOG.md`](../CHANGELOG.md) — generated by `vp run changelog:generate`; never hand-edited                                                                                                                                                                                                                                                                                                                                                       |
| **How to file an issue or PR, and the bar for merging**                          | [`docs/agents/`](./agents/workflow.md) — the templates themselves live where GitHub reads them: `.github/ISSUE_TEMPLATE/`, `.github/pull_request_template.md`                                                                                                                                                                                                                                                                                         |
| **Toolchain notes** (Vite+, fallow)                                              | [`docs/tooling/`](./tooling/)                                                                                                                                                                                                                                                                                                                                                                                                                         |

## By document, what it is and its lifetime

| Doc                              | Audience                  | Lifetime             | Canonical for                                      |
| -------------------------------- | ------------------------- | -------------------- | -------------------------------------------------- |
| `AGENTS.md` (+ `.claude/rules/`) | every agent + human       | durable              | universal standards, the gate, the non-negotiables |
| `COMMANDS.md`                    | every agent + human       | durable              | the command surface (CI-verified — see below)      |
| ADRs                             | every agent + human       | durable, append-only | one decision each, with context + consequences     |
| `*/ARCHITECTURE.md`              | anyone touching that area | durable              | that unit's data flow, deps, constraints           |
| `INVENTORY.md` / `PATTERNS.md`   | anyone building UI        | durable              | reuse catalog / conventions                        |

---

## ADRs: two homes, one number sequence

The home is chosen by **scope — is this a decision about the repository and what
it ships, or about the showcase app's own internals?**
([ADR-048](./decisions/ADR-048-adr-taxonomy-and-one-sequence.md).)

| Home                                                                        | Holds                                                                   |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [`docs/decisions/`](./decisions/)                                           | the repo, the published `@lcabrera/*` packages, the toolchain           |
| [`apps/react-router/docs/decisions/`](../apps/react-router/docs/decisions/) | the showcase app — Modal, Tooltip, the store pattern, grid interaction… |

There were three. The split was originally drawn by "when CQMS moves to its own
repository, does this decision go with it?" — that move happened in #683 and the
CQMS home went with it, which is why an old ADR may cite a number that now
resolves in only one place.

### Reading an ADR written in an earlier era

This repository has been three things, and an ADR means what it meant when it was
written:

| Era                 | What the repo was                                                  |
| ------------------- | ------------------------------------------------------------------ |
| **One app**         | `apps/react-router` alone; no packages                             |
| **A monorepo**      | several apps — the car-sales API servers, CQMS — plus the packages |
| **Public packages** | the `@lcabrera/*` packages are the product; one app exercises them |

So an older ADR naming one of the car-sales API workspaces, or the CQMS admin
app, is not necessarily rot. Two cases, and they are treated differently on purpose:

- **Named as Context** — the evidence that motivated a decision about the
  packages. Left exactly as written. Editing it would falsify _why_ the decision
  was made, which is the one thing an ADR exists to record. ADR-001, ADR-004,
  ADR-005, ADR-035, ADR-039 and ADR-053 are in this group.
- **Named in the Decision** — instructions a reader would follow today, pointing
  at a repository this no longer is. That gets a **dated amendment block** at the
  top: status split, what still governs, what moved and under which issue. The
  body stays verbatim below it. ADR-008 established the shape; ADR-014, ADR-064
  and ADR-071 use it.

The rule that makes this decidable: **never rewrite a body to match today.**
Amend above it, and say what changed.

Those links open the **directory**, which is the listing — each home's `README.md`
is a generated page describing the home and lists no ADRs on purpose, because a
committed list is one region every ADR branch appends to
([ADR-075](./decisions/ADR-075-the-index-does-not-list-the-adrs.md)). To read the
titles as prose rather than as filenames, run `vp run adr:list`.
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
