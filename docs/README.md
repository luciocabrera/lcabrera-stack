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
| **Why a thing is built the way it is** — an architectural decision                | an **ADR** in [`docs/decisions/`](./decisions/) — one home, one number sequence                                                                                                                                       |
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

## ADRs: one home, one number sequence

Every ADR lives in [`docs/decisions/`](./decisions/) — the repo, the published
`@lcabrera/*` packages, and the toolchain. The one sequence is
[ADR-048](./decisions/ADR-048-adr-taxonomy-and-one-sequence.md); that ADR's own
table still lists the homes it was written under, so `adrHomes` in
[`devkit.config.json`](../devkit.config.json) — read by
[`adr-registry.mjs`](../packages/repo-standards/scripts/adr-registry.mjs), which
`vp run adr:verify` enforces — is the live set.

Two other homes existed and are gone. One left with a second product. The
showcase app's own home closed for a different reason, and the criterion is
worth stating because it is not the departure rule below: **the packages are the
product, so an app-only record does not earn an ADR.** Eleven of that home's
ADRs turned out to document code in `packages/ui` — Modal, Tooltip, the `useRef`
store, barrel boundaries, the sort tiebreaker, the filter descriptors, the cookie
primitive, the grid interaction architecture — and moved here keeping their
numbers. The two that were genuinely about the app were deleted.

Their subjects had **not** departed, which is what separates this from the rule
below: the showcase still self-hosts its rows, and StyleX still governs. What
carried the live content was already elsewhere —
[`apps/showcase/docs/data-sources.md`](../apps/showcase/docs/data-sources.md)
describes the self-hosting arrangement in more detail than its ADR did, and
StyleX is Non-Negotiable Rule 2 in `AGENTS.md`. Nothing had to be moved.

**The cost, stated plainly:** a deleted ADR's reasoning survives only in git
history, and a live ADR can end up amending something a reader can no longer
open — ADR-072 amends the self-hosting decision and now names `data-sources.md`
instead. That is a real loss of the append-only property, accepted here because
the alternative was keeping app-only records in a repository whose product is its
packages. Weigh it before deleting the next one.

That is why an old ADR may cite a number, or a path, that now resolves somewhere
else. The number is the stable part.

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
into `packages/ui`'s Form `ARCHITECTURE.md`. (This is the _departure_ rule; the
scope rule above is a separate one and deletes for a different reason.) And a decision that reads oddly
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

That link opens the **directory**, which is the listing — the home's `README.md`
is a generated page describing it and lists no ADRs on purpose, because a
committed list is one region every ADR branch appends to
([ADR-075](./decisions/ADR-075-the-index-does-not-list-the-adrs.md)). To read the
titles as prose rather than as filenames, run `vp run adr:list`.
**A number identifies exactly one ADR**: take the next free one from
`vp run adr:verify`. Unadopted proposals wait in
[`docs/agents/planning/adr-drafts/`](./agents/planning/adr-drafts/) and hold
**no number** — one is assigned at adoption, never at proposal.

**No number is grandfathered any more.** Several low numbers used to mean two
things, because each home started its own sequence at 001; the last surviving
pair was `ADR-005` — the `Form` component here and StyleX in the app home — and
it ended when that home closed. `registers.adrGrandfatheredDuplicates` in
[`devkit.config.json`](../devkit.config.json) is the authority and is now empty,
so `vp run adr:verify` rejects **every** repeat. Editing that register is what
changes the gate.

One consequence to know when reading an older document: a bare `ADR-005` written
before the closure may have meant the StyleX record, which no longer exists — the
number now resolves only to the `Form` component. StyleX itself is Non-Negotiable
Rule 2 in [`AGENTS.md`](../AGENTS.md).

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
- **Plans** (`~/.claude/plans/`, plus the gitignored `.tmp/planning/` and
  `.tmp/epic-<n>/`) — scratch for one task, one planning session, or one epic
  run. Ephemeral, and invisible to everyone else, so whatever has to survive is
  moved out deliberately: a decision **graduates** into an ADR, the work itself
  into GitHub Issues, the session's reasoning into a committed record, and a
  plan's _claim_ (who's on it, which files) into the in-git work register at
  [`docs/coordination/`](./coordination/README.md), so parallel agents can see
  it. Which surface holds what, for how long, and how a landed record is retired
  is the planning charter,
  [`docs/agents/planning/`](./agents/planning/README.md).

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
