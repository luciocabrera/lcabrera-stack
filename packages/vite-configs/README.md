# `@repo/vite-configs`

Shared Vite+ configuration builders for formatting (`oxfmt`) and linting (`oxlint`) across all apps in this monorepo. Every app imports from this package instead of duplicating config.

## Exports

| Import path                                   | Factory                           | Used by                                                                 |
| --------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------- |
| `@repo/vite-configs/fmt`                      | `createFmtConfig`                 | All apps                                                                |
| `@repo/vite-configs/lint`                     | `lintSharedConfig`                | The ROOT config only — see below                                        |
| `@repo/vite-configs/eslint-custom-rules`      | `createCustomRulesLintConfig`     | Shared ESLint flat-config for custom local rules in React apps          |
| `@repo/vite-configs/plugins`                  | `createReactRouterPluginsConfig`  | React Router-style apps using StyleX + React Router + Babel             |
| `@repo/vite-configs/eslint-base-custom-rules` | `createBaseCustomRulesLintConfig` | Shared ESLint flat-config for node/library workspaces (no React/StyleX) |
| `@repo/vite-configs/run`                      | `createReactRouterRunConfig`      | React Router apps; also exports `VITEST_COVERAGE_FLAGS`                 |

## Oxlint is configured once, at the root

`lint` is exported as a single object rather than a factory-per-workspace,
because Vite+ reads `lint` from the **root** `vite.config.ts` only — a `lint`
block in a workspace config is never loaded. Per-workspace differences are
`overrides` inside that one object, with globs resolved from the repo root.

There used to be a `base-lint` → `api-lint` / `frontend-lint` →
`react-router-lint` chain wired into all eleven workspace configs. None of it
ever ran. [ADR-042](../../docs/cqms/decisions/ADR-042-oxlint-config-at-the-root.md)
is the account; `vp run lint:plugins:verify` is what keeps it from coming back.

```
lint                ← the one Oxlint config: categories, plugins, overrides
eslint-custom-rules ← shared ESLint flat config for custom local-rules enforcement
```

## Usage in a `vite.config.ts`

## Install in a consumer app/package

To use this package from another workspace package (for example an app), add it to that package's `package.json`:

```json
{
  "devDependencies": {
    "@repo/vite-configs": "workspace:*"
  }
}
```

Then install dependencies from the workspace root:

```bash
vp install
```

```ts
import { defineConfig } from 'vite-plus';
import { createFmtConfig } from '@repo/vite-configs/fmt';

// A workspace config sets `fmt`, Vite, Vitest and framework config — never
// `lint`, which only the root config can carry.
export default defineConfig({
  fmt: createFmtConfig(),
});
```

### Adding project-level ignore patterns to the formatter

```ts
const fmtConfig = createFmtConfig({
  ignorePatterns: ['.react-router/', 'build/'],
});
```

### Overriding lint rules for a specific app

```ts
const lintConfig = createApiLintConfig({
  rules: {
    'unicorn/no-process-exit': 'off',
  },
});
```

### Sharing the custom local-rules ESLint config

```js
import { createCustomRulesLintConfig } from '@repo/vite-configs/eslint-custom-rules';

export default createCustomRulesLintConfig();
```

### Shared plugins config with optional overrides

```ts
import { createReactRouterPluginsConfig } from '@repo/vite-configs/plugins';

export const pluginsConfig = createReactRouterPluginsConfig({
  appRootUrl: import.meta.url,
  // Optional overrides:
  // pluginsAfter: [myPlugin()],
  // stylexAliasPattern: '../src/*',
  // withBabelPlugin: false,
});
```

## Files

| File                                         | Purpose                                                                      |
| -------------------------------------------- | ---------------------------------------------------------------------------- |
| `vite.fmt.shared.config.ts`                  | Formatter config factory (`createFmtConfig`)                                 |
| `vite.lint.shared.config.ts`                 | The repo's one Oxlint config (`lintSharedConfig`) — imported by the ROOT     |
| `eslint.custom-rules.shared.config.mjs`      | Shared ESLint flat-config factory for local custom rules                     |
| `vite.plugins.shared.config.ts`              | React Router-style plugins config factory (`createReactRouterPluginsConfig`) |
| `eslint.base-custom-rules.shared.config.mjs` | ESLint flat-config factory for node/library workspaces (no React/StyleX)     |
| `vite.run.shared.config.ts`                  | `createReactRouterRunConfig` + `VITEST_COVERAGE_FLAGS`                       |
