# ADR-046 — Detect breaking changes to the public package API surface

- **Status:** Accepted
- **Date:** 2026-07-24
- **Issue:** [#359](https://github.com/luciocabrera/vite-react-compiler/issues/359)
- **Relates to:** [ADR-038](ADR-038-public-package-topology-by-runtime.md) (public-package topology), [ADR-043](ADR-043-release-tooling-changesets-over-pnpm-native.md) (the Changesets flow this gate protects), `scripts/verify-publish-surface.mjs` (the adjacent subpath-parity guard this sits beside).

## Context

"The `packages/` are the product. The `apps/` exist to exercise them" (AGENTS.md).
Apps-as-harness gives coverage of the _integration_ — `typecheck:all` compiles
every in-repo consumer, so an in-repo break fails the gate — but never of the
_contract_. The real consumers of `@lcabrera/{api,server,ui,utils}` live outside
this tree, where nothing here compiles against them.

So a breaking change to a package's **published** surface — a removed named
export, a changed signature, a reshaped union — passes every existing gate. The
closest guard, `publish:verify`, checks that `publishConfig.exports` covers the
same _subpaths_ as `exports` and that each resolves to a built file; it never
reads the type surface. #351 was the concrete instance: it removed exports,
reshaped `QueryFilter` into a discriminated union and changed a signature — all
green, shipped under a changeset declared `minor`, semver-defensible only because
these packages are `0.x` and days-old on npm. Nothing _detected_ the break.

## Decision

A tracked, per-package snapshot of the exported type surface, plus a changeset
cross-check and a type-resolution check. Two `vp run` tasks, sitting beside
`publish:verify` after `packages:build` in `check-safe.yml`:

- **`api-surface:verify`** extracts each public package's exported surface with
  ts-morph — subpath → export name → normalized signature — renders it to a
  golden file under `reports/api-surface/<pkg>.txt`, and fails on any drift,
  listing every added/removed/changed export. `-- --write` regenerates.
  Against the base ref, a **breaking** change (a removal or a signature change)
  must carry a **changeset for that package**; a purely additive change is
  advisory while the packages are `0.x`.
- **`attw:verify`** runs Are The Types Wrong? over the three built packages,
  catching published types that don't resolve for a consumer.

### The snapshot source differs by package, on purpose

`api`/`server`/`utils` build to `dist`, so their snapshot is taken against the
built `.d.mts` — what a consumer installs. `ui` ships **source** (StyleX derives
theme identity from the source path, ADR-038), so its snapshot is taken against
the `src` entries, resolved through `ui`'s own tsconfig. Running one path over
both would repeat the exact hazard `publish:verify` exists for: the repo
exercises the `src` map on every command and the `dist` map on none.

### Boundaries (deliberate, so a follow-up isn't read as a regression)

- **Wildcard subpaths are out of scope.** `ui` exposes open-ended deep-import
  maps (`./components/*`, `./utils/*`). Snapshotting every file they can reach
  would churn on every internal edit and drown the real contract, so the snapshot
  covers the **curated named entries** only. The built packages have no
  wildcards, so this is a no-op for them.
- **Signatures are name-based.** An exported type alias expands to its written
  body (a reshaped union is caught); a value keeps its referenced type names (a
  changed arity/param/return is caught). A change confined to a **non-exported**
  referenced type is not deep-expanded — export the props/args type to bring it
  under the gate. This matches how api-extractor golden files read, and covers
  the whole #351 case, whose reshaped type was itself exported.
- **`attw` is scoped to modern ESM / bundler resolution.** The three packages are
  ESM-only, so attw's legacy `node10` and `node16-cjs` findings are expected by
  design; failing on them would make the gate permanently red.
- **Runtime/behavioural changes are out of scope** — a signature can be
  byte-identical while behaviour changes. Snapshots cannot see that; tests own it.
- **StyleX custom-property identity** (the `ui` CSS-var contract) is a different
  contract, already guarded by `stylex-module-paths.test.ts` and the never-rename
  invariant.

## Alternatives considered

- **`@microsoft/api-extractor`** → one rollup `.api.md` per package. The industry
  norm, but opinionated about a single entry point where `server` has ~30
  subpaths, with its own tsconfig story. The ts-morph extractor is lighter and
  gives full control over normalization and the multi-subpath shape.
- **Snapshotting the raw `.d.mts` text.** Faithful for the built packages but
  loses per-export granularity (the gate must list every changed _export_), has
  no equivalent for source-shipped `ui`, and churns on codegen noise.

## Consequences

- A breaking change to a public package's surface fails a PR unless the snapshot
  is regenerated and a changeset accompanies it — "did I break an external
  consumer?" becomes a gate, not a reviewer's judgement.
- The snapshots are golden files reviewed by diff, like the fallow baselines.
  `.txt`, not `.md`/`.json`, because Oxfmt reflows the latter and the file would
  churn every run.
- The gate advises but does not _apply_ the changeset bump, and while `0.x` it
  flags a removal rather than demanding a major — that stricter rule turns on by
  itself once a package crosses `1.0.0`.
