# `@lcabrera/vite-config`

Vite+ configuration factories and shareable ESLint flat configs for TypeScript
and React workspaces — the format, lint, pack and run settings a monorepo
otherwise copies into every workspace.

Nothing here hardcodes a directory of ours: the workspace roster, the StyleX
source alias and the env-file list are all arguments
([ADR-069](https://github.com/luciocabrera/lcabrera-stack/blob/main/docs/decisions/ADR-069-publish-the-shared-toolchain.md)).

```bash
npm install --save-dev @lcabrera/vite-config
```

## Exports

| Subpath                      | Export                                                | What it is                                                        |
| ---------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------- |
| `./fmt`                      | `createFmtConfig`                                     | Oxfmt settings, with extra `ignorePatterns` and overrides         |
| `./lint`                     | `createLintConfig`                                    | The one Oxlint config — for the **root** config only, see below   |
| `./pack`                     | `createPackConfig`                                    | `vp pack` (tsdown) settings for a package that ships built `dist` |
| `./plugins`                  | `createReactRouterPluginsConfig`                      | StyleX + React Router + Babel plugin list                         |
| `./run`                      | `createReactRouterRunConfig`, `VITEST_COVERAGE_FLAGS` | The `build`/`start`/`test` task set, and the coverage flags       |
| `./eslint-custom-rules`      | `createCustomRulesLintConfig`                         | ESLint flat config for React + StyleX workspaces                  |
| `./eslint-base-custom-rules` | `createBaseCustomRulesLintConfig`                     | The same stack minus React/StyleX, for Node and library packages  |
| `./eslint-restrictions`      | the generic restriction tables                        | Compose them into your own `no-restricted-*` values               |
| `./fixReactRouterAssets`     | `fixReactRouterAssets`                                | Vite plugin: pre-create the CSS assets an SSR build never emitted |

`./fmt`, `./lint`, `./pack`, `./run` and `./eslint-base-custom-rules` need only
`vite-plus` and `eslint`. `./plugins` and `./eslint-custom-rules` pull in the
React/StyleX halves of the peer list — see **Peer dependencies** below.

## Oxlint is configured once, at the root

Vite+ reads `lint` from the **root** `vite.config.ts` only; a `lint` block in a
workspace config is never loaded. So `createLintConfig` returns one object for
the whole repo, and per-workspace differences are `overrides` inside it.

```ts
import { createFmtConfig } from '@lcabrera/vite-config/fmt';
import { createLintConfig } from '@lcabrera/vite-config/lint';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  fmt: createFmtConfig({ ignorePatterns: ['build/'] }),
  lint: createLintConfig({
    // Your workspaces, by runtime. Only used for `env` globals today, so an
    // empty roster is valid — it just classifies nothing.
    workspaceRuntimes: {
      agnostic: ['packages/pure-helpers/**'],
      browser: ['apps/web/**'],
      node: ['apps/server/**', 'packages/tooling/**'],
    },
  }),
});
```

A workspace config sets `fmt`, `pack`, `run` and its Vite/Vitest config — never
`lint`.

## ESLint

Both factories return a flat-config array. The React one is `async`: it resolves
its plugins through a `createRequire` rooted at `tsconfigRootDir`, so a
long-lived editor ESLint process resolves per project rather than from a single
`process.cwd()`.

```js
// eslint.config.mjs
import { createBaseCustomRulesLintConfig } from '@lcabrera/vite-config/eslint-base-custom-rules';

export default createBaseCustomRulesLintConfig({
  tsconfigRootDir: import.meta.dirname,
});
```

### Import boundaries are tables you pass in

`createCustomRulesLintConfig` takes your boundaries rather than switching ours
on. **Compose, never re-declare:** ESLint flat config replaces a rule wholesale
when a later block sets it again, so adding your own `no-restricted-syntax`
block after this factory's silently drops everything it set. That is what
`./eslint-restrictions` is for.

```js
import { createCustomRulesLintConfig } from '@lcabrera/vite-config/eslint-custom-rules';
import {
  NODE_BUILTIN_IMPORT_BOUNDARY_SYNTAX_RESTRICTIONS,
  PG_DRIVER_IMPORT_BOUNDARY_SYNTAX_RESTRICTIONS,
} from '@lcabrera/vite-config/eslint-restrictions';

export default await createCustomRulesLintConfig({
  publicImportBoundaryPatterns: [
    { group: ['@acme/ui/src/**'], message: 'Import @acme/ui public exports.' },
  ],
  serverOnlySyntaxRestrictions: [
    ...NODE_BUILTIN_IMPORT_BOUNDARY_SYNTAX_RESTRICTIONS,
    ...PG_DRIVER_IMPORT_BOUNDARY_SYNTAX_RESTRICTIONS,
  ],
  tsconfigRootDir: import.meta.dirname,
});
```

Omitting `serverOnlySyntaxRestrictions` omits the server/client block entirely —
which is what a package with no client bundle wants.

`./eslint-restrictions` also carries the tables both factories apply
unconditionally, so you can re-compose them: `BARREL_SYNTAX_RESTRICTIONS`,
`REACT_TYPE_IMPORT_PATHS`, `STATE_LIBRARY_IMPORT_PATTERNS` and
`TEST_RUNNER_IMPORT_PATTERNS`.

## Plugins and run tasks

```ts
import { createReactRouterPluginsConfig } from '@lcabrera/vite-config/plugins';
import { createReactRouterRunConfig } from '@lcabrera/vite-config/run';

export const pluginsConfig = createReactRouterPluginsConfig({
  appRootUrl: import.meta.url,
  // Extra StyleX aliases, resolved against `appRootUrl`. None by default.
  stylexAliases: { '@acme/ui/*': '../../../packages/acme-ui/src/*' },
  // withBabelPlugin / withReactRouterPlugin / withFixReactRouterAssetsPlugin
  // each decline one plugin.
});

export const runConfig = createReactRouterRunConfig({
  // Sourced into the shell before `react-router-serve`, in order, skipped when
  // absent. Defaults to the app-local `.env` alone — a bare
  // `react-router-serve` inherits no environment at all, which is the failure
  // this exists for.
  envFiles: ['../../.env', './.env'],
});
```

## Peer dependencies

The peer list is long on purpose: this package composes other people's ESLint
plugins and Vite plugins, and resolving a second copy of one of them is the
failure mode that would otherwise be silent. Install the peers for the subpaths
you use — the optional ones (`@react-router/dev`, `@stylexjs/unplugin`,
`vite-plugin-babel`, `@babel/preset-typescript`, `babel-plugin-react-compiler`)
are needed only by `./plugins`.

One trap worth stating plainly: `./eslint-custom-rules` resolves its plugins
from **the consuming project's** `tsconfigRootDir`, not from this package. Under
pnpm's isolated layout a peer dependency is linked into the dependent's
directory, so declaring the peers here documents the requirement but does not
satisfy that resolver — the project running ESLint has to declare the React
plugin set (`eslint-plugin-react-x`, `eslint-plugin-react-dom`,
`eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`,
`@stylexjs/eslint-plugin`) itself.

The declared peer ranges are the versions this package is exercised against; a
wider range has not been tested.

## License

MIT
