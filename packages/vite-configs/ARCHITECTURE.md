# Package Architecture (`@lcabrera/vite-config`)

The Vite+ config factories and shareable ESLint flat configs every workspace
here builds on — and, since [ADR-069](../../docs/decisions/ADR-069-publish-the-shared-toolchain.md),
a published package any other repository can build on too. The npm name and the
directory differ; read the manifest, not the path.

## Scope

- Reusable formatter, lint, packaging, plugin and task-set factories.
- Stable entry points via `package.json` `exports`; a subpath is a versioned
  contract, tracked in `reports/api-surface/vite-config.txt`.
- **No data about this repository.** Everything that named one of our
  directories became an argument; the values live with their caller.

## Layout

Sources are under `src/` because the package builds: `vp pack` (tsdown) emits
`dist/*.mjs` + `dist/*.d.mts`, `exports` points at `src` so nothing in this repo
has to build first, and pnpm swaps in `publishConfig.exports` at pack time. A
`.ts` file inside `node_modules` is not loadable at all, so a source-shipping
config package would fail when a consumer's Vite config loads it.

| File                                             | What it is                                                      |
| ------------------------------------------------ | --------------------------------------------------------------- |
| `src/vite.fmt.shared.config.ts`                  | `createFmtConfig` — Oxfmt settings                              |
| `src/vite.lint.shared.config.ts`                 | `createLintConfig` — the one Oxlint config, for the ROOT config |
| `src/vite.pack.shared.config.ts`                 | `createPackConfig` — tsdown settings for a built package        |
| `src/vite.plugins.shared.config.ts`              | `createReactRouterPluginsConfig` — StyleX/React Router/Babel    |
| `src/vite.run.shared.config.ts`                  | `createReactRouterRunConfig`, `VITEST_COVERAGE_FLAGS`           |
| `src/fixReactRouterAssets.plugin.ts`             | The Vite plugin folded in from `@repo/plugins`                  |
| `src/eslint.custom-rules.shared.config.mjs`      | `createCustomRulesLintConfig` — React + StyleX flat config      |
| `src/eslint.base-custom-rules.shared.config.mjs` | `createBaseCustomRulesLintConfig` — Node/library flat config    |
| `src/eslint.restrictions.shared.mjs`             | The generic `no-restricted-*` tables both configs compose       |

The `.shared.` infix stays: it is invisible to consumers, who see only the
`exports` subpaths, and renaming would break `git log --follow` on every one of
these files (ADR-069).

### Two file extensions, and why `allowJs` is load-bearing

ESLint flat config is JavaScript, so the three eslint modules are `.mjs`.
tsdown builds them alongside the `.ts` factories, but it only emits their
`.d.mts` when the tsconfig sets `allowJs` — and it reads that from the tsconfig
**on disk**, not from a `dts.compilerOptions` build option, which is silently
ignored. Without the declarations each of those subpaths resolves untyped and
`vp run attw:verify` fails. The flag is set on the generator entry in
`packages/ts-configs/tsconfig.entries.ts`; the tsconfig itself is generated and
must never be hand-edited.

## What stays in this repo, and where it went

ADR-069's rule: the factory ships, the data it is called with does not.

| Data                                                    | Now lives in                                      | Reached by                                |
| ------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------- |
| The workspace roster, by runtime                        | `WORKSPACE_RUNTIMES` in the root `vite.config.ts` | `createLintConfig({ workspaceRuntimes })` |
| The `@lcabrera/ui` / `@lcabrera/server` boundary tables | root `eslint.restrictions.repo.mjs`               | `createCustomRulesLintConfig` options     |
| The StyleX `@lcabrera/ui/*` source alias                | each app's `config/vite.plugins.config.ts`        | `stylexAliases`                           |
| The `docker/local/.env` path                            | each app's `config/vite.run.config.ts`            | `envFiles`                                |

Two of those are visible outside this package: `packages/repo-standards/scripts/verify-lint-plugins.mjs`
reads the roster from the root config, and every workspace that enforces an
import boundary imports the repo tables. Neither is a behaviour change, and both
are Rule 14 territory — an empty table reports exactly the clean pass that
correct code does, so each is proven by a planted violation rather than by a
green run.

## Design rules

- Factory-first: callers pass optional overrides; safe defaults work bare.
- A default may never be a path into the caller's repository.
- Keep types permissive enough for Vite/Oxlint plugin options while avoiding
  `any` in authored code.
- The two `.mjs` config factories carry JSDoc `@param` annotations because the
  published `.d.mts` is derived from them — without one, an option defaulting to
  `[]` is inferred as `never[]`, a type that rejects every value a consumer
  would pass.
- Add a subpath only when the reuse is real: an npm version is permanent, and a
  published subpath is a contract the API-surface gate then holds you to.

### `fixReactRouterAssets` takes its filesystem

Every path the plugin touches is derived from the build root and the emitted
manifest, so none can be a literal — which `security/detect-non-literal-fs-filename`
reports, and this package may not suppress a finding (AGENTS.md §4). The calls
go through an injected seam whose default is node's own functions, referenced
rather than wrapped, so the annotation checks the seam against the real
signatures. It is the same shape `@lcabrera/tsconfig`'s writer uses, and it is
what lets the plugin have a unit suite at all.

### The cycle that is left, and the one that went

`@lcabrera/eslint-plugin` is a runtime `dependency` here, so
`packages/eslint-local-rules` reaches the base ESLint factory by **relative
path** — declaring this package back would close a workspace cycle and break
every recursive `vp run -r` task graph.

`@lcabrera/utils` was in the same position and no longer is: ADR-069 dropped it
from this package's dependencies (there was no import site), so `packages/utils`
now imports `@lcabrera/vite-config` by name like any other workspace.
