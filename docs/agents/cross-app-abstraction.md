# Extract or duplicate? — the cross-app abstraction guideline

Two apps need the same thing. Do you promote it into a package, or write it twice?

The answer is already settled by
[ADR-038](../decisions/ADR-038-public-package-topology-by-runtime.md),
[ADR-039](../decisions/ADR-039-duplicate-over-undeclared-edges.md) and
[ADR-040](../decisions/ADR-040-npm-scope-for-the-public-packages.md) — but it was
settled in three places, so the boundary had to be reassembled every time it came
up. This page is the anchor. It decides nothing new; each step links the ADR that
owns it.

> **The tie-breaker, and it is not a close call.** The `packages/` are the
> product; the `apps/` exist to exercise them. When package self-containment and
> app convenience pull in opposite directions, **the package wins**
> ([ADR-039](../decisions/ADR-039-duplicate-over-undeclared-edges.md)).

---

## The decision, in order

Stop at the first step that answers.

### 1. Does it already exist?

Check the owning workspace's `INVENTORY.md` before writing anything —
[`packages/ui/src/INVENTORY.md`](../../packages/ui/src/INVENTORY.md),
[`packages/server/src/INVENTORY.md`](../../packages/server/src/INVENTORY.md),
[`apps/react-router/src/INVENTORY.md`](../../apps/react-router/src/INVENTORY.md) —
and [`packages/ui/src/PATTERNS.md`](../../packages/ui/src/PATTERNS.md) for how it
is meant to be built.

The best version of this task is usually **a parameter or a config option
threaded through a helper that already exists**, not a new export. An artifact
that _almost_ fits gets generalised in place; its `INVENTORY.md` description
gets updated in the same commit (one sentence).

### 2. Can the edge be declared?

**A package must stand on its own: declared dependencies, a resolvable public
surface, and no reliance on a consumer's tsconfig `paths` to make an import
work.** These packages are consumed from outside this monorepo, where none of its
wiring exists.

So: if sharing the thing would need an edge that only resolves _in this repo_ —
a `paths` alias, a reach into a sibling's `src/`, an undeclared dependency — the
answer is **duplicate**. That is not a compromise; it is
[ADR-039](../decisions/ADR-039-duplicate-over-undeclared-edges.md)'s decision.

### 3. Which runtime is it for?

A shared thing goes to the package whose runtime it matches. The split is
enforced by each package's tsconfig, in both directions, so a mismatch fails
typecheck rather than review
([ADR-038](../decisions/ADR-038-public-package-topology-by-runtime.md) has the
table and what each tsconfig denies):

| It needs…                             | Home                           |
| ------------------------------------- | ------------------------------ |
| nothing — pure, no side effects       | `@lcabrera/utils`              |
| `fetch`, an HTTP contract, a base URL | `@lcabrera/api` (browser-safe) |
| `pg`, `node:crypto`, a query, a token | `@lcabrera/server` (Node-only) |
| to render                             | `@lcabrera/ui`                 |
| the process — signals, exit paths     | `@lcabrera/node` (Node-only)   |

Two traps live here:

- **Purity is a guarantee, not a vibe.** Anything touching the process belongs in
  `@lcabrera/node`, not in `@lcabrera/utils` — that is the whole reason the
  two are separate packages.
- **A client-safe package may only depend on workspace packages that are
  themselves client-safe**, and `packages/ui`'s `check:public-api` enforces it.
  This is why `@lcabrera/api` and `@lcabrera/server` are separate: when they were
  one package, `@lcabrera/ui` needed two fetch helpers and dragged the Postgres
  driver into every consumer's dependency graph.

### 4. Does it ship?

`@lcabrera/*` means it publishes to npm and has consumers outside this repo;
`@repo/*` means internal, change it freely
([ADR-040](../decisions/ADR-040-npm-scope-for-the-public-packages.md)). Picking
the public scope is picking a set of obligations — the never-baseline rule, the
API-surface snapshot, a permanent version number. Read
[AGENTS.md §1](../../AGENTS.md) before adding a fifth.

### 5. Otherwise, extract.

Same runtime, declarable edge, nothing that already covers it: promote it.
Give it an `ARCHITECTURE.md` only if it is a system whose wiring is not
visible from one file
([ADR-088](../decisions/ADR-088-keep-living-architecture-docs-on-systems-not-on-every-folder.md)).

---

## When duplication is the right answer

Duplication is not the fallback for "we couldn't be bothered". It is correct when
it is **cheap, stable and structurally checked** — all three:

- **Cheap** — TypeScript is structural, so two independently declared shapes stay
  assignable with no adapter.
- **Stable** — a small, near-frozen contract costs almost nothing to keep in two
  places.
- **Checked** — drift fails a build somewhere. Copies nothing compares are the
  thing to actually fear.

The worked example is the column-filter shapes, declared independently in
`@lcabrera/ui` and `@lcabrera/server`, neither knowing the other exists. Read
[ADR-039](../decisions/ADR-039-duplicate-over-undeclared-edges.md) for why the
design got _better_ and not merely more decoupled: one type had been carrying UI
drafting states (a value that is `undefined` mid-keystroke) into a SQL-facing
definition, and could not honestly describe both.

### Where the conformance guarantee lives

**In the app** — `apps/react-router` is the only thing that legitimately depends
on several packages at once, so cross-package conformance is verified there.

**Never the converse: a guarantee a _package_ relies on must not live in an app.**
Apps are disposable; packages are not.

---

## What does not get extracted

- **App-specific anything.** Routes, loaders, and the shape of one app's screens.
- **Demo-only code.** The car-sales servers' `api-shared` held what was genuinely
  specific to comparing Express against Fastify, and nothing else. Code that is
  generic belongs in a package — but check step 1 first: being generic is not on
  its own a reason to move something. That bucket left the repo entirely in #686,
  which is the end state this rule was pointing at: demo-only code has no claim
  on a package, and eventually no claim on the repo either.
- **A guarantee that already has a home.** Prefer widening the existing artifact
  over adding a second one that overlaps it.

---

## Related

- [ADR-038](../decisions/ADR-038-public-package-topology-by-runtime.md) — the
  runtime topology and what each tsconfig denies
- [ADR-039](../decisions/ADR-039-duplicate-over-undeclared-edges.md) — duplicate
  over an undeclared edge; where the conformance test lives
- [ADR-040](../decisions/ADR-040-npm-scope-for-the-public-packages.md) — which
  scope a package takes, and what the public one obliges
- [`.github/skills/typescript-api-engineering/`](../../.github/skills/typescript-api-engineering/SKILL.md)
  — the API engineering standards this sits under
- [`docs/README.md`](../README.md) — where every other kind of fact lives
