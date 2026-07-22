# ADR-042 — Oxlint is configured once, at the root

- **Status:** Accepted
- **Date:** 2026-07-22
- **Supersedes:** the per-workspace Oxlint factory layer (`base-lint`,
  `api-lint`, `frontend-lint`, `react-router-lint`)
- **Issue:** [#318](https://github.com/luciocabrera/vite-react-compiler/issues/318)

## Context

Every workspace carried a `lint` block in its own `vite.config.ts`, built from a
`@repo/vite-configs/*-lint` factory. None of it was ever loaded.

This is not a Vite+ defect. `node_modules/vite-plus/docs/guide/monorepo.md` says
so plainly:

> You can define the defaults for `lint`, `fmt`, etc. at the root, and use
> `overrides` to apply package-specific lint and format settings. […] You can
> still have separate `vite.config.ts` files in each package for the Vite,
> Vitest, framework or runtime configuration.

The repo was using the tool against its documented model. The cost was not
theoretical: a whole rule layer looked like protection and provided none, and a
deliberate violation of a rule the factory listed at `error` passed every gate.

Two properties of Oxlint make this class of mistake invisible, and both were
learned the expensive way here.

**A plugin family goes dark silently.** Naming `lint.plugins` **replaces**
Oxlint's default set rather than adding to it. An earlier fix on this same issue
added `plugins: ['react', 'react-perf', 'import', 'node']` to the root config to
make plugin resolution explicit, and by doing so switched off `typescript`,
`unicorn` and `oxc` repo-wide. The repo stayed green throughout, because a rule
that is not loaded and code that is correct produce identical output.

**A plugin without its category is decorative.** A plugin only contributes rules
whose category is enabled. `react-perf` and `node` were listed for a long time
and contributed nothing, because their rules live in categories this repo does
not enable.

## Decision

**Oxlint is configured once, in the root `vite.config.ts`.** Per-workspace
differences are `lint.overrides` entries with root-relative globs. The config
object lives in `@repo/vite-configs/lint` and is imported by the root config, so
the factory pattern survives — it just lives where Vite+ actually reads it.

**A workspace `vite.config.ts` carries no `lint` key.** It is for Vite, Vitest,
framework and runtime config only.

**Oxlint runs no ESLint-plugin rules.** The `jsPlugins` bridge (`react-x`,
`react-dom`, `@stylexjs`, `local-rules`, `perfectionist`, `security`) is gone.
The eslint pass already loads every one of those plugins and enforces the same
rules; running them in both engines means resolving the same plugin twice to
report the same finding twice. This is not a retreat from the overlapping-linter
policy — overlap is valuable where the engines **independently** agree, not where
one engine is shelling out to the other's plugin.

**A plugin is listed only if it contributes rules under an enabled category.**
Listing one that cannot fire is the same failure this ADR is about, in miniature.

**Every workspace is classified by runtime, and that is checked.** The overrides
carry a `browser`, a `node` and a `runtime-agnostic` list, and the gate fails if
a workspace appears in none of them or if a glob names a workspace that no longer
exists. This is not decoration by the rule above: `env` supplies globals to the
`no-undef` family, which is not enabled today, so the lists are currently inert
as rules and exact as documentation. They are kept correct rather than deleted
because they become load-bearing the moment that category is enabled — and
because a hand-maintained list that nothing checks is precisely how this went
wrong the first time. The lists were initially written from whichever workspaces
happened to carry a `lint` block, which is the shape of the setup that never
loaded; six workspaces were silently missing, `packages/utils` and `packages/api`
among them.

`packages/utils` is deliberately in neither runtime list. Its tsconfig gives it
no DOM lib and no node types, it imports nothing from `node:`, and anything that
must touch the process belongs in `@repo/node-runtime` instead. Handing it
`process` here would contradict the boundary that tsconfig exists to enforce.

## Consequences

The live rule count roughly doubles, and the previously-dark `typescript`,
`unicorn` and `oxc` families come back. Fixing the single finding this surfaced
used a rule **option** (`promise/no-callback-in-promise`'s `exceptions`) rather
than a disable, per AGENTS.md §4 — Express's `next` is genuinely the error
channel, and restructuring the code does not help because the rule matches the
callback's name rather than its shape.

Two plugins are deliberately held back, each needing its own decision rather than
a silent enable:

- **`jsx-a11y`** — its findings land largely on `packages/ui`, and several are on
  the exact components where [ADR-035 §5](ADR-035-biome-third-linter.md) already
  concluded the analyser was wrong about that code (the tooltip trigger, the tabs
  header, the resize handle). Enabling it re-opens decisions already argued in
  writing. Tracked in #325.
- **`vitest`** — it contributes a large number of findings, almost all from one
  opinionated rule, and none are machine-fixable. Tracked in #326.

### Enforcement

`vp run lint:plugins:verify` (`scripts/verify-lint-plugins.mjs`, a CI step in
`check-safe.yml`) is the guard, and it **lints a deliberate violation per plugin
family** rather than reading the config — because reading the config is exactly
what cannot distinguish a loaded family from a missing one. It also fails on a
`lint` key in any workspace config, on a workspace missing from every runtime
list, and on a runtime glob that resolves to nothing. It imports the config
module directly rather than scanning its text, so the classification it checks is
the one Oxlint actually receives.

Its own negative tests matter as much as its passing run: dropping a plugin from
the list must make it fail, naming that family. A gate that has never been seen
to fail is indistinguishable from one that cannot.

`import` has no probe. Its correctness rules overlap tsgolint, which reports the
same defect as a TypeScript error first, so a probe for it would pass whether or
not the plugin loaded — the same non-discriminating evidence that produced the
wrong conclusions on #318 in the first place (AGENTS.md Rule 14).
