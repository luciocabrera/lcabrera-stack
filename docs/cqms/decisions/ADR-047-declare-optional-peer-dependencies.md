# ADR-047 — Declare optional peer dependencies, and prove vestigial ones by regenerating the lockfile

- **Status:** Accepted
- **Date:** 2026-07-25
- **Issue:** [#382](https://github.com/luciocabrera/vite-react-compiler/issues/382)
- **Corrects:** [#357](https://github.com/luciocabrera/vite-react-compiler/issues/357) / [#358](https://github.com/luciocabrera/vite-react-compiler/pull/358), whose stated mechanism was wrong.
- **Relates to:** [ADR-045](ADR-045-vite-plus-test-imports.md) (the `vite-plus/test` switch that prompted the audit), [ADR-044](ADR-044-decline-pnpm-global-virtual-store.md) (adjacent pnpm-resolution decision).

## Context

pnpm installs an **optional peer dependency only while something in the tree
declares it**. Nothing in the workspace surfaces that edge: the package is
present in `node_modules`, imports resolve, tasks pass — and none of it is
attributable to the declaration that is holding it up.

That produced a two-day silent breakage. After ADR-045 moved test imports to
`vite-plus/test`, an audit asked which `vitest`-adjacent devDependencies had
become vestigial. It concluded that `vitest` is load-bearing (every workspace
invokes its binary **by path**, which needs a direct dep) but that
`@vitest/coverage-v8` is not, because "vitest resolves the v8 coverage provider
from vite-plus's own dependency tree at runtime". #358 removed all seven
declarations — `apps/admin_system`, `apps/react-router`, `packages/api`,
`packages/node-runtime`, `packages/scan-ingestion`, `packages/server`,
`packages/utils` — and `cleanupUnusedCatalogs` pruned the catalog entry.

Both halves of that reasoning were false, and the evidence behind it could not
have shown so:

- **`vite-plus` does not depend on `@vitest/coverage-v8`.** It declares
  `@vitest/browser`, `@vitest/expect`, `@vitest/runner` and others; the provider
  is not among them. Check with
  `node -p "require('vite-plus/package.json').dependencies['@vitest/coverage-v8']"`.
- **The supporting observation was a tautology.** "Seven other workspaces
  already run coverage green **without** declaring it" was true — but only
  because the seven that _did_ declare it kept the peer edge alive on the shared
  `vitest` instance. Every workspace was drawing on the same declarations the
  change then deleted.

Nothing regenerated the lockfile afterwards, so the resolved edge survived as a
stale entry and coverage kept working for two days. The first
`pnpm clean --lockfile` — inside a routine `vp run deps:refresh` — resolved the
tree honestly: the provider fell from 53 lockfile references to 3 (unresolved
optional-peer metadata), and every `--coverage` run died with
`MISSING DEPENDENCY`. The Fallow Audit failed in its coverage step, before it
analysed a single file, which is a considerable distance from the cause.

## Decision

**1. An optional peer this repo relies on is declared, in the catalog.**
`@vitest/coverage-v8` is cataloged under `test` and declared **once**, in the
root manifest. A single declarer is sufficient — pnpm materialises the peer on
the shared `vitest` instance, and every workspace resolves it from there. Seven
declarations were never needed; zero was one too few.

The root declaration is load-bearing in a second way: `cleanupUnusedCatalogs` is
on, so the catalog entry survives only because a manifest references it. Remove
the root dep and the catalog entry self-prunes with it.

**2. "Vestigial" is proved by regenerating the lockfile, not by observation.**
Before removing any dependency declaration, run the removal against a lockfile
resolved from scratch and then run the task that consumes it:

```bash
pnpm clean --lockfile && vp install
vp run coverage:merge          # or whichever task depends on it
```

A green run against the _existing_ lockfile proves nothing — the edge under test
may be exactly what is holding the package in place. This is Rule 14 applied to
dependency resolution: the probe has to be able to produce a different answer
than the one hoped for, and reading `node_modules` cannot, because a stale
lockfile and a correct one look identical there.

## Consequences

- One declaration to maintain instead of seven, and it cannot drift from the
  runner: `overrides.vitest: catalog:test` already forces every `vitest` edge —
  including vite-plus's bundled copy and the provider's peer — to one version.
- The catalog comment carries the mechanism, so the next audit that notices
  "nothing imports this" has the counter-argument in front of it.
- A dependency removal now costs a full reinstall to justify. That is slower
  than reading the import graph and is the point: the cheap check is the one
  that was wrong.
- This generalises past `@vitest/coverage-v8`. Any optional peer — coverage
  providers, browser providers, framework plugins resolved by name at runtime —
  is subject to the same failure, and the same proof.

## Alternatives considered

**Re-add all seven declarations.** Restores the previous state and is
demonstrably sufficient, but it is also demonstrably more than required, and
seven copies of one fact is what made the original cleanup attractive. Rejected
in favour of one declaration plus the comment explaining why it exists.

**Pin the provider as a direct dependency of `vite-plus`.** Not ours to change,
and it would make the repo depend on an upstream packaging choice that has
already moved once.

**Leave it undeclared and disable coverage in the audit.** This is the
workaround shape: it would turn a broken gate green while removing the signal
the gate exists for. Rejected — fallow scores CRAP from real coverage, and an
audit fed no coverage reports trivially simple code as `critical` (AGENTS.md §4).
