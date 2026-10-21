---
governs:
  - vite-configs
  - repo-standards
---

# ADR-138 — Proposal: Oxfmt sorts imports, and perfectionist/sort-imports is turned off

**Status:** Proposed — deferred until Oxfmt keeps a header comment block in place (block-only comment partitions); see [Status, 2026-10-21](#status-2026-10-21)

**Issue:** [#1414](https://github.com/luciocabrera/lcabrera-stack/issues/1414)

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
ADR-035 §4 orders. Oxfmt has a `sortImports` option modelled on
perfectionist's `sort-imports`. Turned on, it orders imports in every file the
formatter already reaches, with no per-workspace config needed.

Moving the rule changes two published entry points in a single release, so it
is recorded here instead of in a cleanup PR.

## Decision

This section is the proposal, and it is not in effect. `perfectionist/sort-imports`
still sorts imports in both ESLint factories, and `createFmtConfig` sets no
`sortImports`. [Status, 2026-10-21](#status-2026-10-21) says why it is deferred
and what reopens it.

Proposed: Oxfmt owns import order, and `createFmtConfig` sets this option:

```json
"sortImports": { "order": "asc", "partitionByComment": true, "internalPattern": ["@/","~/"],
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

### How the option maps the perfectionist rule

The rule it would replace is configured as
`{ order: 'asc', partitionByComment: { block: true }, type: 'natural' }`.

- `order: 'asc'` carries over as `"order": "asc"`.
- `type: 'natural'` has no option to map to. Oxfmt's `sortImports` has no
  comparison-type setting, and its comparison is already natural, so `foo9`
  sorts before `foo10` exactly as under perfectionist.
- `partitionByComment: { block: true }` has no equivalent. Oxfmt's
  `partitionByComment` is a boolean, and `true` makes **every** comment a
  partition. So a line comment between two imports now stops sorting across it,
  where perfectionist sorted through it and carried the comment along with the
  import below it. A block comment between two imports partitions under both.
  For order between imports, the effect is a looser check: two imports split by
  a line comment can sit out of order without being reported. `false` was
  rejected because it is wrong the other way round. It sorts across a block
  comment and moves imports out of a partition someone wrote on purpose.
- **A comment block directly on the first import is not a partition under either
  setting.** Oxfmt treats it as part of that import. When another import sorts
  ahead, the block is carried down into the import list. Perfectionist's block
  partition keeps it at the top of the file. This is a reordering, not a looser
  check, and it moves the file-level header that
  [ADR-136](ADR-136-lint-evals-from-a-root-eslint-config.md) set the block
  partition to protect. A blank line between the header and the first import
  keeps the header in place under Oxfmt.

### Evidence

With these groups, Oxfmt reproduces the order perfectionist already enforces in
every file ESLint reaches. Every file it changes is one ESLint never read. Oxfmt's
default groups do not reproduce that order. The measurement, the versions it
ran on, the command that reproduces it, and the probes behind the mapping above
are in the evidence comments on #1414 ([measurement and mapping probes](https://github.com/luciocabrera/lcabrera-stack/issues/1414#issuecomment-6299104842), [header and line-comment probes](https://github.com/luciocabrera/lcabrera-stack/issues/1414#issuecomment-6299229360))
and in [#1435](https://github.com/luciocabrera/lcabrera-stack/pull/1435).

## Consequences

These are the consequences of adopting the proposal. None of them applies while
it is deferred.

- **Consumers of `./fmt`.** `vp fmt` and `vp check --fix` reorder imports in
  files no ESLint config covers. That includes root config files, tooling
  scripts outside a workspace, and fenced code in markdown. A file that already
  passed `perfectionist/sort-imports` keeps its import order, because the groups
  were tuned to the same order. That was measured on this repository's tree, not
  on every possible import. The exception is a header comment written with no
  blank line before the first import, which can move as described above. A
  consumer who wants the old behaviour can pass `sortImports: false` in
  `overrides`.
- **Headers have to be protected before the option is turned on.** In this
  repository's root scripts, some files have a header directly on their first
  import, and the proposed config moves those headers. The implementation would
  have to leave every header in place, for example by separating each one from
  its imports with a blank line. Otherwise the first comment block stops being
  the file's header.
- **Line comments no longer travel with their import.** A line comment between
  imports becomes a divider that stays put. The `@lcabrera/vite-config` README
  and ADR-136's Consequences describe the perfectionist behaviour, so the
  implementation would update the README, and ADR-136 would be read with this
  ADR.
- **The ESLint-pass gate loses its probe rule.** `@lcabrera/repo-standards`'
  `eslint-pass-probe.mjs` sets `PROBE_RULE = 'perfectionist/sort-imports'`. It
  plants an out-of-order import in each probe workspace and expects the rule to
  report it. With the rule off, every probe is `silent`, and
  `lint:eslint:verify` fails in `check:push`, `check:safe` and CI, with advice
  that points at the shared ESLint configs. The implementation would have to choose a replacement
  rule from a factory that still loads it. As the probe's header requires, the
  replacement must be confirmed to report a planted violation before the gate
  relies on it. It should also still drive the plugin code path that #472
  broke. That change ships with the factory change, so no repository runs the gate
  against a rule that is turned off.
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
  so fenced code blocks are sorted too. That reaches a Changesets-generated
  `CHANGELOG.md`, and the README of a
  published package ships in its tarball. The implementation issue decides how
  generated files are handled. This ADR does not.
- **A config the formatter owns.** The groups are written against Oxfmt's
  selector vocabulary. An Oxfmt upgrade that changes how a selector classifies a
  specifier changes the order everywhere at once, and `vp fmt --check` is what
  reports it.

## Status, 2026-10-21

The direction was accepted on 2026-10-20 and deferred on 2026-10-21. A review
of the proposed config found three costs:

- **The header moves.** Oxfmt treats a comment block that sits directly on the
  first import as part of that import, so a file's header is carried into the
  import list when another import sorts ahead of it.
- **No block-only partition.** Oxfmt's `partitionByComment` is a boolean, so it
  cannot partition on block comments alone as perfectionist's
  `{ block: true }` does, and a line comment stops imports being sorted across it.
- **The ESLint-pass gate loses its probe rule.** `lint:eslint:verify` probes
  `perfectionist/sort-imports`, so turning that rule off fails the gate until a
  confirmed replacement rule is chosen.

Until this is reopened, `perfectionist/sort-imports` stays the import sorter,
and files outside every workspace's ESLint config stay unchecked for import
order.

**Reopen condition.** An Oxfmt release whose `sortImports` keeps a leading
comment block at the top of the file and partitions on block comments only.
Re-check it with the header, line-comment and block-comment probes recorded in
[the addendum on #1414](https://github.com/luciocabrera/lcabrera-stack/issues/1414#issuecomment-6299229360)
and [the first evidence comment](https://github.com/luciocabrera/lcabrera-stack/issues/1414#issuecomment-6299104842).
When they match perfectionist, reopen #1426 and move this ADR to Accepted. The
probe-rule replacement is still the implementation's to do.

## Alternatives considered

- **Keep perfectionist and add an ESLint pass over root `scripts/`.** Rejected.
  It covers one directory in this repository, while the gap is every file
  outside a workspace in every repository that installs the factories. Each
  consumer would have to find and cover its own uncovered paths, and a new root
  file would go unchecked until someone noticed. A rule in the formatter covers
  those files because the formatter already reads them.
- **Turn on `sortImports` with Oxfmt's default groups.** Rejected on the
  evidence above: it reorders source files that perfectionist already orders,
  which churns every consumer's tree and gains nothing.
- **Run both sorters.** Rejected. Two engines would arbitrate one rule, and any
  difference between them is a fix loop. ADR-035 already refuses that for Biome's
  `useExhaustiveDependencies`, which another engine owns.

## References

- [ADR-035](ADR-035-biome-third-linter.md) §4 — the pre-commit chain, one glob,
  format-only pass last.
- [ADR-136](ADR-136-lint-evals-from-a-root-eslint-config.md) — the last time a
  root directory needed its own ESLint pass.
- The measurement and the comparison probes:
  [#1414 evidence comment](https://github.com/luciocabrera/lcabrera-stack/issues/1414#issuecomment-6299104842),
  [#1414 header and line-comment addendum](https://github.com/luciocabrera/lcabrera-stack/issues/1414#issuecomment-6299229360),
  [#1435](https://github.com/luciocabrera/lcabrera-stack/pull/1435).
- Parent issue [#1410](https://github.com/luciocabrera/lcabrera-stack/issues/1410).
  The implementation, [#1426](https://github.com/luciocabrera/lcabrera-stack/issues/1426),
  is closed as deferred and reopens when the condition in
  [Status, 2026-10-21](#status-2026-10-21) is met.
- The maintainer's deferral is recorded on
  [#1435](https://github.com/luciocabrera/lcabrera-stack/pull/1435).
