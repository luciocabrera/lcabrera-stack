# Where does X live? — the documentation map

This repo keeps its knowledge in several places on purpose, each with a different
job. The rule that keeps them from rotting into each other:

> **One canonical home per fact. Everything else _links_ to it — never copies it.**
> A copy is a copy nobody updates. When two docs would say the same thing, one
> states it and the other points.

Start here when you're not sure where something belongs, or where to look.

---

## By question

| You want to know…                                                                 | Canonical home                                                                                                                                                                                                        |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **The rules** — TS/React/StyleX standards, the non-negotiables, the quality gate  | [`AGENTS.md`](../AGENTS.md) (+ path-scoped [`.claude/rules/`](../.claude/rules/))                                                                                                                                     |
| **How to run something** — every `vp` command, what CI runs                       | [`COMMANDS.md`](../COMMANDS.md)                                                                                                                                                                                       |
| **Why a thing is built the way it is** — an architectural decision                | an **ADR** (two homes, one number sequence — see the warning below)                                                                                                                                                   |
| **How other projects solved a problem we are deciding** — external research       | [`docs/agents/research/`](./agents/research/README.md) — dated, sourced write-ups that feed an ADR; not plans, which live in [`docs/agents/planning/`](./agents/planning/)                                            |
| **Who's working on what right now** — in-flight work, owners, area locks          | [`docs/coordination/`](./coordination/README.md) — the task register (`tasks/*.md`); `vp run coordination:board` renders a local table view                                                                           |
| **The durable backlog** — what should happen next, epics, milestones              | GitHub **Issues / sub-issues / Milestones / Projects**; boundary vs. the register in [ADR-036](decisions/ADR-036-github-planning-layer.md), runbook [`docs/tooling/github-planning.md`](./tooling/github-planning.md) |
| **How a _system_ is wired** (Table, Form, a query builder — not a leaf component) | that system's `ARCHITECTURE.md`. A leaf component's contract is its types; whether it exists is the inventory ([ADR-088](decisions/ADR-088-keep-living-architecture-docs-on-systems-not-on-every-folder.md))          |
| **Naming / structure / StyleX conventions**                                       | the nearest `PATTERNS.md` (e.g. [`packages/ui/src/PATTERNS.md`](../packages/ui/src/PATTERNS.md))                                                                                                                      |
| **Does an artifact already exist before I build one**                             | the app/package `INVENTORY.md` (react-router, ui, server)                                                                                                                                                             |
| **Whether to extract shared code into a package or duplicate it**                 | [`docs/agents/cross-app-abstraction.md`](./agents/cross-app-abstraction.md) — the decision in order; ADR-038/039/040 own the steps                                                                                    |
| **A task workflow** (review, fallow scan, quality gate…)                          | [`.github/skills/`](../.github/skills/) `SKILL.md` files                                                                                                                                                              |
| **How to write a commit / PR** (the enforced format)                              | the [`commit-and-pr`](../.github/skills/commit-and-pr/SKILL.md) skill; spec in [`packages/repo-standards/scripts/commit-convention.mjs`](../packages/repo-standards/scripts/commit-convention.mjs)                    |
| **How to write English that doesn't read as generated**                           | the [`unslop`](../.github/skills/unslop/SKILL.md) skill                                                                                                                                                               |
| **What a change must prove before it goes up for review**                         | [`docs/agents/refactor-verified-contract.md`](./agents/refactor-verified-contract.md) — the independent-verifier standard; procedure in the [`refactor-verified`](../.github/skills/refactor-verified/SKILL.md) skill |
| **What an agent code review may block a merge for, and how to override it**       | [`docs/agents/agent-review-contract.md`](./agents/agent-review-contract.md) — the verdict schema, the blocking severities, the override path                                                                          |
| **Whether Copilot has reviewed the head commit, and what to do when it has not**  | [`docs/tooling/copilot-review-gate.md`](./tooling/copilot-review-gate.md) — the `Copilot review complete` status, its states, the break-glass path                                                                    |
| **Why a review-gate status is stale, and how to recompute it**                    | [`docs/tooling/review-gate-reconcile.md`](./tooling/review-gate-reconcile.md) — the scheduled sweep over both gates, its interval, and the recovery                                                                   |
| **What changed / release notes**                                                  | [`CHANGELOG.md`](../CHANGELOG.md) — generated by `vp run changelog:generate`; never hand-edited                                                                                                                       |
| **How to file an issue or PR, and the bar for merging**                           | [`docs/agents/`](./agents/workflow.md) — the templates themselves live where GitHub reads them: `.github/ISSUE_TEMPLATE/`, `.github/pull_request_template.md`                                                         |
| **Toolchain notes** (Vite+, fallow)                                               | [`docs/tooling/`](./tooling/)                                                                                                                                                                                         |

## By document, what it is and its lifetime

| Doc                              | Audience                 | Lifetime           | Canonical for                                                                                                                                                         |
| -------------------------------- | ------------------------ | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md` (+ `.claude/rules/`) | every agent + human      | durable            | universal standards, the gate, the non-negotiables                                                                                                                    |
| `COMMANDS.md`                    | every agent + human      | durable            | the command surface (CI-verified — see below)                                                                                                                         |
| ADRs                             | every agent + human      | durable; see below | one decision each, with context + consequences                                                                                                                        |
| `*/ARCHITECTURE.md`              | anyone touching a system | durable            | that system's data flow and constraints — not a leaf component's props ([ADR-088](decisions/ADR-088-keep-living-architecture-docs-on-systems-not-on-every-folder.md)) |
| `INVENTORY.md` / `PATTERNS.md`   | anyone building UI       | durable            | reuse catalog / conventions                                                                                                                                           |
| `docs/agents/research/*.md`      | anyone deciding the same | dated record       | how other projects solved it, at a named commit                                                                                                                       |

---

## ADRs: two homes, one number sequence

The home is chosen by **scope — is this a decision about the repository and what
it ships, or about the showcase app's own internals?** The one sequence across
both homes is [ADR-048](./decisions/ADR-048-adr-taxonomy-and-one-sequence.md);
that ADR's own table still lists the third home it was written under, so
`ADR_HOMES` in
[`adr-registry.mjs`](../packages/repo-standards/scripts/adr-registry.mjs) — which
`vp run adr:verify` enforces — is the live set.

| Home                                                                        | Holds                                                                   |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [`docs/decisions/`](./decisions/)                                           | the repo, the published `@lcabrera/*` packages, the toolchain           |
| [`apps/react-router/docs/decisions/`](../apps/react-router/docs/decisions/) | the showcase app — Modal, Tooltip, the store pattern, grid interaction… |

A third home existed while a second product lived here, and left with it. That
is why an old ADR may cite a number which now resolves in only one place.

### An ADR names no product but this one

Older ADRs were written while other products shared this repository, and their
Context sections cited those products by name as the evidence that motivated a
decision. Those names are gone: an ADR describes the constraint it decided
against — "a second app needed to reuse the component library" — never the
departed thing that happened to supply it. The reasoning is unchanged, and the
decision still follows from the context it records; only an identity was
removed.

**Including identities that still resolve.** Sibling repositories are on the
roster too, and their links went with them. That is deliberate rather than an
overreach of the rule: these packages are read by consumers who have none of this
repository's history and no access to anything beside it, so a doc that leans on
a link out is a doc that stops working the moment it ships. Where a pointer
carried something actionable, the replacement states the thing itself — a
contract a substitute server must serve, rather than the address of one that
does.

Two consequences worth knowing. An ADR whose subject left entirely is deleted
rather than kept as a husk, and what still governs is folded into the live doc
that owns it — that is where ADR-014's Cancel/discard-changes rationale went,
into `packages/ui`'s Form `ARCHITECTURE.md`. And a decision that reads oddly
general was often specific once; `vp run adr:list` plus `git log --follow` is
how to recover what it was about.

**This is not a licence to revise an ADR.** Append-only still governs the part
that matters: a conclusion is superseded by a _new_ ADR, never edited into a
different one, and no decision recorded here has been re-argued. What was removed
is an identity, not a claim — which is why an amended ADR now says its body keeps
its original reasoning rather than that it is verbatim. If you find yourself
changing what an ADR decided, you are writing the next ADR.

`vp run departed:verify` keeps this true — the names live in
[`scripts/departed-names.json`](../scripts/departed-names.json), so a
reintroduced one fails the build rather than waiting to be noticed.

Those links open the **directory**, which is the listing — each home's `README.md`
is a generated page describing the home and lists no ADRs on purpose, because a
committed list is one region every ADR branch appends to
([ADR-075](./decisions/ADR-075-the-index-does-not-list-the-adrs.md)). To read the
titles as prose rather than as filenames, run `vp run adr:list`.
**A number identifies exactly one ADR**: take the next free one from
`vp run adr:verify`, whichever home you are writing in. Unadopted proposals wait
in [`docs/agents/planning/adr-drafts/`](./agents/planning/adr-drafts/) and hold
**no number** — one is assigned at adoption, never at proposal.

⚠️ **A few low numbers predate the single sequence and exist in both homes** —
`ADR-004` is the package standalone quality gate _and_ React Compiler. Cite those
by path. `GRANDFATHERED_DUPLICATES` in
[`adr-registry.mjs`](../packages/repo-standards/scripts/adr-registry.mjs) is the
set, and `vp run adr:verify` enforces it. They are deliberately not renumbered:
an ADR is a dated record.

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
  — an ADR for a decision, or a `*_PLAN.md` for a spec — and the scratch file is
  then disposable. A plan's _claim_ (who's on it, which files) graduates to the
  in-git work register at
  [`docs/coordination/`](./coordination/README.md), so parallel agents can see
  it.

---

## Hygiene (how this stays true)

- **Update the canonical doc in the same commit as the change that moves it.**
  COMMANDS.md says this at the top; it applies to every doc here.
- **`COMMANDS.md` is machine-checked.** `vp run commands:verify` (CI, via
  `check:safe`) fails the build if a documented command doesn't resolve or a real
  script is undocumented. It cannot check prose — so prose still needs care.
- **A new decision gets an ADR** in the right home (`vp run adr:new`).
- **A new artifact** gets a one-sentence `INVENTORY.md` row; a **new
  convention**, a `PATTERNS.md` entry; a **new system** (wiring not visible
  from one file), its own `ARCHITECTURE.md`. A new folder is not a system
  ([ADR-088](decisions/ADR-088-keep-living-architecture-docs-on-systems-not-on-every-folder.md)).
- When in doubt, prefer **linking over restating.** The link cannot go stale in a
  way the target doesn't; a paraphrase can.
