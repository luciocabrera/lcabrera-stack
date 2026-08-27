# Product requirements

What the packages must let a consumer do, written so that something other than a
person can check it.

One file per requirement, under [`requirements/`](./requirements/). Each states
the requirement in its persona's vocabulary, lists acceptance criteria that are
decidable rather than aspirational, and carries typed pointers to where the
answer lives. [`VISION.md`](./VISION.md) names the two product lines and the
three personas those statements are written for.

A requirement outlives the issue that implements it. That is the whole reason
this layer exists: acceptance criteria authored on an issue are read once and
evaporate when it closes, so the next agent re-derives the intent — or invents a
different one.

## What this layer is canonical for

- **What a consumer must be able to do** with the published packages, in the
  consumer's words rather than in the packages' words.
- **Whether that is true today** — the `state` field, declared by whoever last
  changed the answer ([ADR-093](../decisions/ADR-093-declare-a-requirement-state-rather-than-derive-it.md)).
- **Where to look to check it** — the `evidence` pointers, which say where the
  answer lives; they are not a proof that it is `met`.
- **Which packages a requirement concerns**, so the work a package owes is
  answerable without reading every file that mentions it.

## Four things it is not

Each of these has a real home, and putting it here instead is how two homes for
one fact start.

| Not this                                                                           | Its home                                                                                                                                                                              |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What should happen next**, in what order, and by when                            | GitHub **Issues / sub-issues / Milestones / Projects** ([ADR-036](../decisions/ADR-036-github-planning-layer.md), [`docs/tooling/github-planning.md`](../tooling/github-planning.md)) |
| **Why a thing is built the way it is** — a decision, and its rejected alternatives | an ADR in [`docs/decisions/`](../decisions/)                                                                                                                                          |
| **Who is touching which files right now**                                          | the task register in [`docs/coordination/`](../coordination/README.md)                                                                                                                |
| **How far the product is from its intent, as a measurement**                       | a report produced on demand and never committed ([ADR-049](../decisions/ADR-049-findings-reports-are-produced-on-demand.md))                                                          |

The last row is the one that will be tested. A requirement declares `met` or
`unmet` and nothing in between: a percentage, a score, a burn-down or an "as of"
date is a measurement, and a measurement in a tracked file is right on the day it
is written and wrong from the next commit, with nothing to say which it is.

## The shape of a requirement

Every rule below is one a script can decide, which is deliberate — an
unenforceable convention is a convention that rots.

### Frontmatter

| Field      | Rule                                                                                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`       | kebab-case, equal to the filename slug. Unique across the directory                                                                                   |
| `lines`    | one or more of `application`, `toolchain` — the product lines it is a requirement of ([`VISION.md`](./VISION.md))                                     |
| `persona`  | exactly one of `application-developer`, `repository-maintainer`, `data-user`                                                                          |
| `state`    | `met` or `unmet`, declared ([ADR-093](../decisions/ADR-093-declare-a-requirement-state-rather-than-derive-it.md)). No third value, no date, no number |
| `packages` | workspace directory names (`ui`, `server`, `repo-standards`, …) — the roster derived from `pnpm-workspace.yaml`, not npm package names                |
| `requires` | ids of requirements this one leans on. A cycle is a malformed register                                                                                |
| `issues`   | the backlog items that move it, by number. Empty once nothing is outstanding                                                                          |
| `evidence` | typed pointers, `type` one of `code`, `test`, `command`, `doc`, and `ref` a repo-relative path or a `vp run` command                                  |

One is plural and the other is not, on purpose. A requirement can be a
requirement of both product lines — a document that reads correctly on the
registry is owed by every published package — but it is written in **one voice**,
and a statement addressed to two personas at once ends up addressed to neither.
Pick the persona the requirement **fails hardest for**. Each persona's
section in [`VISION.md`](./VISION.md) ends with its failure modes, and that
list is the tie-breaker — not the roster of packages, which answers a
different question.

Three more rules carry weight:

- **A requirement declaring `met` carries at least one `command` pointer that CI
  runs.** A claim with nothing running behind it is a claim that goes stale in
  silence; one attached to a command in the gate fails loudly when it stops
  being true.
- **`packages` names workspace directories.** `node-runtime`, not `@lcabrera/node`;
  `eslint-local-rules`, not `@lcabrera/eslint-plugin`. The directory name is what
  `deriveWorkspaces` in
  [`packages/repo-standards/scripts/workspace-scopes.mjs`](../../packages/repo-standards/scripts/workspace-scopes.mjs)
  produces, and it is what the `pkg:` label taxonomy already uses.
- **`evidence` says where the answer lives, not that the answer is yes.** An
  `unmet` requirement carries pointers too, and they are where a reader goes to
  see the gap. Only the first rule above is about proof.

### Body

An H1 title, then `## Statement`, then `## Acceptance`. `## Notes` is optional
and holds what a reader needs and the other two sections cannot carry.

**The statement and the acceptance criteria are different things, and writing one
where the other belongs is the common failure.** A worked pair:

> **Statement** (the persona's vocabulary, no package names if it can be
> avoided): _I have an array of rows and a set of columns, and I want a working
> table on the page without a server, a loader or a route._
>
> **Acceptance** (decidable, and it names what decides it): _`@lcabrera/ui`'s
> entry map and `packages/ui/src/public-api.ts` both resolve a component whose
> props are the rows and the columns, and `vp run api-surface:verify` records it
> in the published surface._

The statement survives a redesign; the acceptance criteria do not, and are
rewritten when the design moves. Keeping them apart is what lets the first stay
stable.

**Acceptance bullets carry no checkbox.** The state of the requirement is
declared once, in `state`. A box is a second declaration of the same fact in the
same file, and two copies drift — reliably in the direction where the boxes are
right and the field is stale.

## Adding one

Copy [`requirements/_TEMPLATE.md`](./requirements/_TEMPLATE.md) to
`requirements/<id>.md` and fill it in. That is the whole change: **adding a
requirement touches exactly one file.**

Neither this page nor `VISION.md` lists the requirements, and neither ever will.
An index is one region every branch appends to, so two agents adding a
requirement in the same week conflict on a file neither of them cares about — the
reasoning is [ADR-075](../decisions/ADR-075-the-index-does-not-list-the-adrs.md),
which retired exactly that table from the ADR home. The directory is the listing.

`_TEMPLATE.md` is not an entry. It sorts above the requirements, and the doc
gates already skip that name everywhere it appears
([`packages/repo-standards/scripts/markdown-corpus.mjs`](../../packages/repo-standards/scripts/markdown-corpus.mjs)).

**The register does not claim to be complete.** It holds the requirements
somebody has written down, and a product statement with no file here is not
thereby out of scope — it is unwritten. Write it when the work needs it, in the
change that needs it, rather than in a sweep that tries to enumerate the product
in one sitting.
