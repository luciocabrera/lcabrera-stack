---
kind: charter
status: live
recorded: 2026-08-27
issues: []
packages: []
---

# Planning documents

The committed home for a planning session's **reasoning** — the design it
settled on, the probes behind it, and the map from its planning ids to the
issues it filed. The work itself is not here: status, milestones, dependencies
and acceptance criteria live on GitHub Issues, which
[ADR-036](../../decisions/ADR-036-github-planning-layer.md) makes canonical for
them.

Following [ADR-075](../../decisions/ADR-075-the-index-does-not-list-the-adrs.md),
this page lists none of the documents — the directory is the listing.

## Which surface holds a plan, and for how long

A plan-shaped document has four possible homes and only the last one is in git.
Pick by how long it has to survive and who else has to read it.

| Surface            | Holds                                                                         | Lives                                           | Readable by             |
| ------------------ | ----------------------------------------------------------------------------- | ----------------------------------------------- | ----------------------- |
| `~/.claude/plans/` | one agent's scratch for one task                                              | that task                                       | that agent              |
| `.tmp/planning/`   | the one-shot input `vp run plan:issues` renders a backlog from                | until `--create` files the issues, then retired | that machine            |
| `.tmp/epic-<n>/`   | an epic run's wave plan and its per-PR review and verdict bodies              | that epic run                                   | that machine            |
| **here**           | the reasoning and the identifier map GitHub does not hold, once work is filed | until the work lands, then as a dated record    | everyone, on any branch |

Three consequences of that split:

- **`.tmp/` is gitignored, so nothing in it is shared with anyone.** Anything
  another agent or the human has to read goes to GitHub or into this directory.
  That is why an epic run posts its wave plan as a comment on the epic issue as
  well as writing it to `.tmp/`
  ([`../epic-orchestration.md`](../epic-orchestration.md)).
- **A backlog input is consumed, not committed.** `vp run plan:issues` takes
  `--plan <file>` and has no tracked default on purpose: a standing "the backlog"
  file in git would be a second durable backlog. What survives the run is the
  identifier map, and that belongs in a `summary` here.
- **A spec that outlives its session graduates into a document here**, carrying
  the block below. A _decision_ graduates further, into an ADR
  ([`../../decisions/`](../../decisions/)); this directory holds no decision
  anything else is required to follow.

## What belongs here, and what does not

|                                                                    | Home                                                  |
| ------------------------------------------------------------------ | ----------------------------------------------------- |
| What **we** intend to do — a design, and the session that filed it | here                                                  |
| What another project does, read from its source                    | [`../research/`](../research/README.md)               |
| The decision itself, once made                                     | an ADR in [`../../decisions/`](../../decisions/)      |
| A decision proposed but not adopted, holding no number             | [`adr-drafts/`](./adr-drafts/)                        |
| Status, milestones, dependencies, acceptance criteria              | GitHub Issues (ADR-036)                               |
| Who is touching which files right now                              | [`../../coordination/`](../../coordination/README.md) |

## The block every document here carries

Five keys, at the top of the file, before the `#` heading:

```yaml
---
kind: plan
status: live
recorded: 2026-07-25
issues: ['#389', '#390']
packages: [server, showcase]
---
```

| Key        | Value                                                                                                                                                                                         |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kind`     | `plan`, `summary`, `standard` or `charter` — the table below                                                                                                                                  |
| `status`   | `live`, `landed` or `superseded`                                                                                                                                                              |
| `recorded` | `YYYY-MM-DD`, the day the document was written. Never bumped — an amendment carries its own date, which is the point of having one.                                                           |
| `issues`   | the issues the document serves, `#`-prefixed. **A `plan` must name at least one**: a plan whose work is not filed is scratch, and scratch belongs in `.tmp/`.                                 |
| `packages` | the workspace directory names the document concerns (`server`, `ui`, `showcase`), so a document is findable by the package it is about. Empty is fine; a name that is not a workspace is not. |

| `kind`     | Is                                                                                    | Lifetime                     |
| ---------- | ------------------------------------------------------------------------------------- | ---------------------------- |
| `plan`     | the design a session settled on, and the evidence for it                              | dated record                 |
| `summary`  | what a session filed — the epic table and the planning-id → issue map                 | dated record                 |
| `standard` | an advisory standard this repo's code is written against, claiming no ADR's authority | durable until it is promoted |
| `charter`  | this page, and the one in `adr-drafts/`                                               | durable                      |

`recorded` plus a `kind` of `plan` or `summary` is what marks a document a
**dated record**: true as of that day, and amended above the body rather than
rewritten, so the reasoning that produced a decision survives the decision moving
on.

`status` describes **the work the document is about**, not the prose:

- `live` — that work is still open, so the document still reads as direction.
- `landed` — it has closed. Read the document as history: what was decided and
  why, not what to do next.
- `superseded` — another document replaced it, and says so in the body.

## Retiring a landed document

A landed plan left reading as direction is worse than no plan, because it is
read as current and acted on. When the work a document describes closes:

1. flip `status` to `landed`;
2. **amend above the body; never rewrite it** — add a dated block at the top
   saying what landed and where, so the reasoning that produced the decision
   stays as it was written. Editing the body to match today falsifies the reason
   the decision was made, which is the one thing the record exists to hold;
3. leave the identifier map alone. Resolving an old `P-07` reference to an issue
   number is the job that outlives the work.

Do not restate an issue's state in the body. It changes, nothing here checks it,
and `gh issue view <n>` answers it. A **dated** amendment may carry it, because
it is pinned to the day it was true — name the command that re-derives it
(AGENTS.md §7).
