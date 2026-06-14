# `@repo/vite-configs`

Shared Vite+ configuration builders for formatting (`oxfmt`) and linting (`oxlint`) across all apps in this monorepo. Every app imports from this package instead of duplicating config.

## Exports

| Import path                              | Factory                          | Used by                                                        |
| ---------------------------------------- | -------------------------------- | -------------------------------------------------------------- |
| `@repo/vite-configs/fmt`                 | `createFmtConfig`                | All apps                                                       |
| `@repo/vite-configs/base-lint`           | `createBaseLintConfig`           | Internal — extended by other configs                           |
| `@repo/vite-configs/api-lint`            | `createApiLintConfig`            | Node.js / server apps (`api-server`, `api-server-fast`)        |
| `@repo/vite-configs/eslint-custom-rules` | `createCustomRulesLintConfig`    | Shared ESLint flat-config for custom local rules in React apps |
| `@repo/vite-configs/frontend-lint`       | `createFrontendLintConfig`       | Browser apps without React Router                              |
| `@repo/vite-configs/react-router-lint`   | `createReactRouterLintConfig`    | React Router apps                                              |
| `@repo/vite-configs/plugins`             | `createReactRouterPluginsConfig` | React Router-style apps using StyleX + React Router + Babel    |

## How configs relate

```
base-lint          ← shared rules, plugins, categories
    │
    ├── api-lint          ← base + no JSX rules  (server apps)
    │
    └── frontend-lint     ← base + react-x / react-dom plugins
            │
            └── react-router-lint   ← frontend + .react-router/ ignores

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
import { createReactRouterLintConfig } from '@repo/vite-configs/react-router-lint';

export default defineConfig({
  fmt: createFmtConfig(),
  lint: createReactRouterLintConfig(),
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

## Merging configs

`vite.config-merge.ts` exports `mergeOxlintConfig` — a deep-merge utility used internally by the config builders. You can also use it directly to layer additional oxlint config on top of a shared base:

```ts
import { mergeOxlintConfig } from '@repo/vite-configs/merge';
```

It merges arrays (rules, plugins, ignorePatterns) by concatenation and merges objects (categories, env, options) by shallow spread — so base values are never silently dropped.

## Files

| File                                      | Purpose                                                                      |
| ----------------------------------------- | ---------------------------------------------------------------------------- |
| `vite.fmt.shared.config.ts`               | Formatter config factory (`createFmtConfig`)                                 |
| `vite.base-lint.shared.config.ts`         | Base lint config factory (`createBaseLintConfig`)                            |
| `vite.api-lint.shared.config.ts`          | Server/Node lint config factory (`createApiLintConfig`)                      |
| `eslint.custom-rules.shared.config.mjs`   | Shared ESLint flat-config factory for local custom rules                     |
| `vite.frontend-lint.shared.config.ts`     | Frontend lint config (`createFrontendLintConfig`)                            |
| `vite.plugins.shared.config.ts`           | React Router-style plugins config factory (`createReactRouterPluginsConfig`) |
| `vite.react-router-lint.shared.config.ts` | React Router lint config (`createReactRouterLintConfig`)                     |
| `vite.config-merge.ts`                    | Deep-merge utility for OxlintConfig objects                                  |
