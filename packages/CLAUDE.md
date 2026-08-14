# Working inside `packages/`

Loads when you touch anything under `packages/`. The always-on framing — packages
are the product, the `@lcabrera/` vs `@repo/` scope split, the never-baseline rule
— is in the root [AGENTS.md](../AGENTS.md) §1 and §4. This file is the
**publishing contract** for the public packages: `@lcabrera/ui`,
`@lcabrera/api`, `@lcabrera/server`, `@lcabrera/utils`,
`@lcabrera/eslint-plugin`, `@lcabrera/tsconfig`, `@lcabrera/node`,
`@lcabrera/vite-config`.

A published package's npm name and its workspace directory need not match, and
three of them already do not: `@lcabrera/eslint-plugin` lives in
`packages/eslint-local-rules`, `@lcabrera/node` in `packages/node-runtime` and
`@lcabrera/vite-config` in `packages/vite-configs`. Read the manifest, not the
path.

## Publishing invariants

All of them are **published on npm**. `private` is off and each has a configured
trusted publisher, so a merged version bump publishes on its own — there is no
longer a flag standing between a mistake and the registry, and **an npm version
is permanent**: it cannot be replaced, and unpublishing blocks reuse of the
number. (`vp run publish:verify` and `npm view <pkg> version` report the current
state — no version number is written down here, because a written one rots.)

Two things follow, and both cost a broken release to learn: a package's manifest
must declare `repository` or the provenance attestation is rejected (`E422`), and
`changeset publish` shells out to `pnpm publish`, so the release job has to put
pnpm on PATH itself.

What holds, verified by packing each package and reading the tarball rather than
by inspection:

- **All but `@lcabrera/ui` build; `ui` alone ships source.** A `.ts` file inside
  `node_modules` is not loadable at all — Node refuses to strip types there
  (`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`) — and Vite externalizes
  dependencies for SSR by default, so a source-shipping package fails when a
  consumer's server _starts_, not when it typechecks. Every other public package
  therefore runs `vp pack` (tsdown) to `dist` with `.d.mts` and sourcemaps —
  which is also how you tell the two apart in a manifest, since a `build` script
  is exactly what `publish:verify` and the API-surface gate key on. `ui`
  cannot: StyleX derives theme identity from the source path, so a consumer's own
  plugin has to compile it.
- **Shipping source changes how `@lcabrera/ui` may import itself, and the rule is
  not cosmetic.** A consumer compiles _our_ files, so every self-reference in
  them resolves through our own `exports` map. A wildcard target is a directory
  or an extensionless path, neither of which `exports` resolution will complete —
  so the package-name form (`@lcabrera/ui/components/Button`) resolved for
  nobody, and the published package could not be imported at all. `packages/ui`
  now self-imports through `#ui/*`, declared in its `imports` field and
  unreachable from outside the package, and its `exports` names concrete files
  with no wildcard. **There is deliberately no `@lcabrera/ui/*` tsconfig alias**
  anywhere — its absence is what makes `vp run typecheck` check deep imports
  against the real map instead of short-circuiting it
  ([ADR-060](../docs/decisions/ADR-060-source-shipping-package-module-resolution.md)).
- **`exports` points at `src`; `publishConfig.exports` points at `dist`.** pnpm
  substitutes the latter at pack time, so no workspace in this repo ever has to
  build before it can typecheck, test or run. The cost is that the repo exercises
  the `src` map on every command and the `dist` map on none — a subpath added to
  one and forgotten in the other is invisible until someone installs the package.
  `vp run publish:verify` is what catches that: it packs each package with pnpm,
  reads the tarball back and imports the result from outside this repo, so it
  answers for the artifact rather than for the manifest. CI runs
  `packages:build` first, and with no `dist/` the gate **fails** — there is no
  artifact, so there is nothing it could have verified.
- **The `publishConfig` swap is a pnpm extension, and the release path is what
  makes it real.** `npm pack` ignores field overrides entirely and produces a
  tarball whose `exports` still point at `./src/*.ts`, which a consumer cannot
  load. Nothing is broken today because `changeset publish` shells out to
  `pnpm publish` — a property of the release tooling, not of the manifest — so
  `publish:verify` asserts it: the root `pnpm-lock.yaml` (changesets picks its
  publish tool by detecting it), the `pnpm@` `packageManager` pin, and a release
  workflow that still runs `pnpm exec changeset publish` and no `npm publish`.
  Publishing one of these packages by hand with npm ships something no consumer
  can import, permanently
  ([ADR-073](../docs/decisions/ADR-073-publishing-gates-check-the-packed-tarball.md)).
- **A breaking change to the published _type surface_ is a gate, not a review
  call.** `publish:verify` checks subpath parity but never reads the types, so a
  removed export, a changed signature or a reshaped union inside a surviving
  subpath ships silently — the harness only ever compiles _in-repo_ consumers,
  and these packages' consumers are external. `vp run api-surface:verify`
  diffs each package's exported surface against a tracked snapshot under
  `reports/api-surface/` (built `dist` for all but `ui`, which ships `src`) and,
  against the base ref, requires a changeset for a breaking change;
  `vp run attw:verify` confirms the published types actually resolve for a
  consumer. Both run after `packages:build` in `check-safe.yml`. The snapshot
  convention, the `ui`-vs-built split and the boundaries are
  [ADR-046](../docs/decisions/ADR-046-public-api-surface-snapshot.md).
- **Each carries its own `LICENSE`** (MIT). npm only includes a `LICENSE` sitting
  in the package directory, so the root one does not reach a consumer — this is
  deliberate duplication, same reasoning as
  [ADR-039](../docs/decisions/ADR-039-duplicate-over-undeclared-edges.md).
- **`files` is `["src", "!src/**/*.test.*"]`**, with `"dist"` added for every
  built package (all but `ui`, which ships source). Without it npm ships
  whatever is in the directory:
  `@lcabrera/server` was shipping its whole test suite plus its tsconfigs and
  `eslint.config.mjs`. The negated pattern is honoured by pnpm pack. `src` stays
  in the built packages only because they emit sourcemaps — it is unreachable
  through the published `exports` map, so it exists purely to let a consumer step
  into the original TypeScript.
- **Framework singletons are `peerDependencies`, not `dependencies`** — `react`,
  `react-dom`, `react-router`, `@stylexjs/stylex` in `@lcabrera/ui`. As ordinary
  dependencies a consumer would resolve a second copy of React, which breaks
  hooks outright. They are also listed in `devDependencies` so the workspace
  still resolves them for typecheck and tests. `@react-router/node` is an
  **optional** peer: only the `./entry/*` SSR helpers import it, so a
  browser-only consumer should not be forced to install it.
  `@lcabrera/vite-config` is the same shape at a larger scale — every ESLint and
  Vite plugin it composes is a peer, so a consumer never resolves a second copy
  of one, and the five that only `./plugins` reaches are optional peers.
- **A `.mjs` source is still a built entry.** `@lcabrera/vite-config` ships
  ESLint flat configs, which are JavaScript; tsdown builds them like any other
  entry, but emits their `.d.mts` only when the workspace's **generated**
  tsconfig sets `allowJs` — a `dts.compilerOptions` build option is silently
  ignored and the build fails with "tsgo did not generate dts file". Without the
  declarations the subpath resolves untyped and `attw:verify` fails; and because
  they are then inferred, an option defaulting to `[]` publishes as `never[]`
  unless the source carries a JSDoc `@param`.
- `catalog:` and `workspace:*` need no special handling — pnpm rewrites both to
  real version ranges at pack time, in `peerDependencies` as well as
  `dependencies` (verified by packing and reading the tarball's manifest).
- **`publishConfig.access: "public"`** on each. npm defaults a scoped package to
  restricted and a free org cannot host private packages, so without it the first
  publish fails on permissions without naming the missing field.
- **Never rename a published package, and never move a `*.stylex.ts`.** StyleX
  derives every custom-property name from
  `packageName:pathRelativeToPackageRoot`, computed without reading the file, so
  either one silently renames the variables and breaks a consumer's
  `createTheme`. `packages/ui/src/stylex-module-paths.test.ts` guards the paths;
  nothing guards the package name but this sentence.

## `@lcabrera/server` error contract

**`@lcabrera/server` never lets a raw `pg` error out, and every executor takes an
optional `tx`.** A driver message names tables, columns and indexes and its
`detail` line quotes the offending values, so the executors translate it into
typed errors
([ADR-050](../docs/decisions/ADR-050-server-error-translation-and-result-contract.md))
— error **classes** stay server-only, and what crosses a loader/action boundary
is a plain serializable union, because React Router single fetch drops functions
silently.

`withTransaction` is the seam for a multi-step write
([ADR-051](../docs/decisions/ADR-051-with-transaction-and-tx-executor-option.md)),
with one trap worth knowing before you use it: an executor called _without_ `tx`
inside the block runs on a different connection, **outside** the transaction, and
nothing detects that.

## Runtime split

`api` and `server` split on **runtime**, and the tsconfigs enforce it in both
directions — `@lcabrera/api` gets no `node` types, `@lcabrera/server` gets no DOM
lib. `packages/ui`'s `check:public-api` enforces the invariant that **a
client-safe package may only depend on workspace packages that are themselves
client-safe**. Full topology:
[ADR-038](../docs/decisions/ADR-038-public-package-topology-by-runtime.md).

`utils` and `node` split on purity: `@lcabrera/utils` guarantees pure,
side-effect-free helpers, so anything that must touch the process (signal
handlers, exit paths) belongs in `@lcabrera/node` (`packages/node-runtime`).
Publishing did not merge them, and did not fold `@lcabrera/node` into
`@lcabrera/server` either — that would drag `pg` into a consumer that only
wanted a shutdown handler
([ADR-069](../docs/decisions/ADR-069-publish-the-shared-toolchain.md)).

Release mechanics (Changesets, the manual first publish, `private: true`) are in
the **`releasing` skill**.
