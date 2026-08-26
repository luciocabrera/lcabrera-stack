# Scout charter — DUPLICATION

Find near-identical modules ripe for a shared abstraction. The precedent is the
route loaders already consolidated into `createTableRouteLoader`.

## Tools

- `vp run fallow:dupes`, `vp run fallow:full`. Scope with `-w 'apps/showcase'`.
  Artifacts land in `reports/fallow/`, which is produced on demand — **run the
  command; there is no snapshot to read.**
- `packages/ui/src/INVENTORY.md` and `packages/ui/src/PATTERNS.md`. The repo's
  "Reuse Before You Build" rule means an artifact that _almost_ fits should be
  generalized, not duplicated.

## What to prefer

Duplication **within a single workspace** is usually safe to consolidate.
**Cross-package** duplication is usually deliberate — read `known-traps.md`
(ADR-039, ADR-038) before proposing any extraction that creates a package edge.

fallow has a `min-lines` floor, so short helpers duplicated many times are
invisible to it. The last sweep found `flagValue` defined five times
byte-for-byte across four _enforced gates_ and fallow reported nothing. Hash
normalised function bodies rather than trusting the tool.

## Prior findings

Already handled (do not refile): the copy-pasted root-script CLI helpers, now in
`packages/repo-standards/scripts/cli-input.mjs`.

Reviewed and deliberately left, with reasons in #519: the enterprise-orders
constants the showcase copies from the external API's domain layer (deliberate,
and no longer a repo-local duplication at all since that layer moved to its own
repository, which is what the copies existed to survive);
`edit-order`/`order-detail` loaders (~10 lines, and the same pattern is already
accepted in `reports/fallow/baselines/dupes.json`); `coverage-report.mjs`/`merge-coverage.mjs`
(divergences deliberate and documented); `build-insert-query`/`build-update-query`
(micro-abstraction on a published package).

Still open as JUDGMENT: the `IconBase` split (#519), the three untied
enterprise-orders column enumerations (#519), and the Form field-builder cluster
(#122, #126, #127).

## Classification note

Extracting a shared abstraction is almost always JUDGMENT.
