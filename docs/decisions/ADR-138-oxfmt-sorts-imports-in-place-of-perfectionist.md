---
governs:
  - vite-configs
---

# ADR-138 — Oxfmt sorts imports, and perfectionist/sort-imports is turned off

**Status:** Accepted

**Issue:** [#1414](https://github.com/luciocabrera/lcabrera-stack/issues/1414)
**Amends:** [ADR-035](ADR-035-biome-third-linter.md) §4 — the format-only pass
that closes the pre-commit chain now also orders imports.

## Context

`@lcabrera/vite-config` ships two ESLint factories, `./eslint-custom-rules` and
`./eslint-base-custom-rules`. Both include
`perfectionist.configs['recommended-natural']`, and both set
`perfectionist/sort-imports` to `error` through `SHARED_PLUGIN_RULE_SEVERITIES`.
ESLint runs once per workspace, from that workspace's `eslint.config.mjs`. A file
that no workspace config governs is never checked for import order. In a
repository built on these factories, that means the root `vite.config.ts` and
any tooling directory at the root that is not a workspace.

The package also ships `./fmt`, whose `createFmtConfig` returns the Oxfmt
config. Oxfmt runs from the root over every file it is not told to ignore. It
runs inside `vp check`, and it is the last step of the `staged` chain that
ADR-035 §4 orders. Oxfmt 0.73 has a `sortImports` option modelled on
perfectionist's `sort-imports`. Turned on, it orders imports in every file the
formatter already reaches, with no per-workspace config needed.

Moving the rule changes two published entry points in a single release, so it
is recorded here instead of in a cleanup PR.

## Decision

Oxfmt owns import order. `createFmtConfig` sets this option:

```json
"sortImports": { "partitionByComment": true, "internalPattern": ["@/","~/"],
  "groups": [["type-builtin","type-external"],["value-builtin","value-external"],
             ["type-internal","type-subpath"],["value-internal","value-subpath"],
             ["type-parent","type-sibling","type-index"],["value-parent","value-sibling","value-index"],"unknown"] }
```

`SHARED_PLUGIN_RULE_SEVERITIES` sets `'perfectionist/sort-imports': 'off'`. It
has to be explicit, because `recommended-natural` turns the rule on and would
otherwise bring it back. The rest of perfectionist stays on: `sort-objects`,
`sort-object-types`, `sort-named-imports` and the other rules in the preset
still run.

Both changes ship in the same `@lcabrera/vite-config` release.

### Evidence

Measured on 2026-10-20 against `main` at `ed8313e34`, with `oxfmt` 0.73.0
through `vite-plus` 1.3.0.

To reproduce, pass the option through the root `vite.config.ts`'s existing
`createFmtConfig` call as `overrides: { sortImports: … }`, then run:

```bash
vp fmt --check . 2>&1 | grep -E ' \([0-9]+ms\)$'
```

That prints one line per file the option would rewrite. Without the override the
same command prints nothing, because the tree is clean.

| Config                         | Non-markdown files under `packages/*/src` and `apps/*/src` | Non-markdown files repo-wide                                 | Markdown files (fenced code) |
| ------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------- |
| The groups above               | 0                                                          | 57: 56 under root `scripts/`, plus the root `vite.config.ts` | 20                           |
| `sortImports: true` (defaults) | 1210                                                       | not counted                                                  | not counted                  |

The first row is what the decision rests on. With the groups above, Oxfmt
produces the same order perfectionist already enforces in every file ESLint
reaches, so every change it makes is in a file ESLint never reached. The second
row shows that the groups have to be tuned: Oxfmt's default groups disagree with
perfectionist's order in most source files.

## Consequences

- **Consumers of `./fmt`.** `vp fmt` and `vp check --fix` reorder imports in
  files no ESLint config covers. That includes root config files, tooling
  scripts outside a workspace, and fenced code in markdown. A file that already
  passed `perfectionist/sort-imports` should not move, because the groups were
  tuned to the same order. The evidence shows that for this repository's tree,
  not for every possible import. A consumer who wants the old behaviour can pass
  `sortImports: false` in `overrides`.
- **Consumers of the ESLint factories.** `perfectionist/sort-imports` stops
  reporting. A consumer who uses an ESLint factory but formats with a config
  other than `createFmtConfig` loses import-order checking and has to turn the
  rule back on in their own config. That trade is why both changes ship in one
  release: a consumer on both entry points always has exactly one sorter. Two
  releases would leave a window with no sorter or with two of them.
- **Order is fixed, not reported.** A lint finding becomes a formatting change.
  `vp fmt --check` and `vp check` fail on a misordered import the way they fail
  on any formatting difference. They do not name a rule.
- **Markdown is in scope.** `embeddedLanguageFormatting` defaults to `"auto"`,
  so fenced code blocks are sorted too. In the measurement, one of the 20
  markdown files is a Changesets-generated `CHANGELOG.md`, and the README of a
  published package ships in its tarball. The implementation issue decides how
  generated files are handled. This ADR does not.
- **A config the formatter owns.** The groups are written against Oxfmt's
  selector vocabulary. An Oxfmt upgrade that changes how a selector classifies a
  specifier changes the order everywhere at once, and `vp fmt --check` is what
  reports it.

## Alternatives considered

- **Keep perfectionist and add an ESLint pass over root `scripts/`.** Rejected.
  It covers one directory in this repository, while the gap is every file
  outside a workspace in every repository that installs the factories. Each
  consumer would have to find and cover its own uncovered paths, and a new root
  file would go unchecked until someone noticed. A rule in the formatter covers
  those files because the formatter already reads them.
- **Turn on `sortImports` with Oxfmt's default groups.** Rejected on the
  evidence above: it reorders 1210 source files that perfectionist already
  orders, which churns every consumer's tree and gains nothing.
- **Run both sorters.** Rejected. Two engines would arbitrate one rule, and any
  difference between them is a fix loop. ADR-035 already refuses that for Biome's
  `useExhaustiveDependencies`, which another engine owns.

## References

- [ADR-035](ADR-035-biome-third-linter.md) §4 — the pre-commit chain, one glob,
  format-only pass last.
- [ADR-136](ADR-136-lint-evals-from-a-root-eslint-config.md) — the last time a
  root directory needed its own ESLint pass.
- Parent issue [#1410](https://github.com/luciocabrera/lcabrera-stack/issues/1410).
  The implementation is [#1426](https://github.com/luciocabrera/lcabrera-stack/issues/1426),
  blocked by this decision.
