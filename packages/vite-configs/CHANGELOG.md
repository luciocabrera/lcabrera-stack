# @lcabrera/vite-config

## 0.3.0

### Minor Changes

- 4022625: The `eslint-plugin-unicorn` peer range moves to `^73.0.0`.

  **This is the breaking part:** the range no longer admits unicorn 72, so a
  consumer staying on 72 gets an unmet peer and must move with it.

  unicorn 73's recommended set adds `unicorn/single-line-block-comment-style`. The
  shared config turns it **off** for now, so upgrading does not silently impose a
  new comment style on anyone consuming this config.

  The rule's default option is `multiline`, and applied to a codebase that writes
  one-line doc comments its fixer rewrites

  ```ts
  /** One page of distinct values for a column. */
  ```

  into

  ```ts
  /*
  One page of distinct values for a column.
  */
  ```

  — a block comment with no `*` prefix on its content line, which is no longer
  JSDoc. Its other option, `single-line`, enforces the opposite direction. Picking
  between the two is a house-style decision rather than a correctness one, and it
  is deferred rather than settled: the entry in `SHARED_PLUGIN_RULE_SEVERITIES`
  carries the reason and names the issue that decides it.

  A consumer who wants the rule can enable it with either option; nothing here
  prevents that, and a comment already in canonical JSDoc form (`/**` followed by
  `* `-prefixed lines) is exempt under both.

## 0.2.0

### Minor Changes

- 1bac0d7: The repo's shared toolchain configuration is now a published package,
  `@lcabrera/vite-config`. It carries the Vite+ `fmt`/`lint`/`pack`/`run` factories
  and the two ESLint flat configs — the settings a monorepo otherwise copies into
  every workspace — plus the React Router asset-fix Vite plugin, folded in from
  what was a separate one-export package.

  ```ts
  // vite.config.ts, at the repo root
  import { createFmtConfig } from '@lcabrera/vite-config/fmt';
  import { createLintConfig } from '@lcabrera/vite-config/lint';
  import { defineConfig } from 'vite-plus';

  export default defineConfig({
    fmt: createFmtConfig({ ignorePatterns: ['build/'] }),
    lint: createLintConfig({
      workspaceRuntimes: {
        browser: ['apps/web/**'],
        node: ['packages/tooling/**'],
      },
    }),
  });
  ```

  Nine subpaths: `./fmt`, `./lint`, `./pack`, `./plugins`, `./run`,
  `./eslint-custom-rules`, `./eslint-base-custom-rules`, `./eslint-restrictions`
  and `./fixReactRouterAssets`.

  **Nothing here hardcodes a directory of ours.** Three things did, and each became
  an argument whose default is "none": the Oxlint workspace roster
  (`createLintConfig({ workspaceRuntimes })`), the StyleX source alias
  (`createReactRouterPluginsConfig({ stylexAliases })`) and the env files the
  `start` task sources (`createReactRouterRunConfig({ envFiles })`, defaulting to
  the app's own `.env` alone — a bare `react-router-serve` inherits no environment
  at all, which is the failure that option exists for).

  **Import boundaries are tables you pass in, not switches you turn on.**
  `createCustomRulesLintConfig` took `enforceUiPublicImportBoundary` /
  `enforceServerClientImportBoundary` booleans that enabled tables naming packages
  of ours; it now takes `publicImportBoundaryPatterns` and
  `serverOnlySyntaxRestrictions`. `./eslint-restrictions` publishes the generic
  tables to compose into them — barrels, state libraries, the test runner, the
  `node:` protocol and the `pg` driver. Compose rather than re-declare: ESLint flat
  config replaces a rule wholesale when a later block sets it again, so a second
  `no-restricted-syntax` block silently drops the first one's restrictions.

  **The peer list is long, and that is the honest cost.** Every ESLint and Vite
  plugin this composes is a peer, so a consumer never resolves a second copy of
  one; the five only `./plugins` reaches are optional peers. One trap:
  `./eslint-custom-rules` resolves its plugins from the consuming project's
  `tsconfigRootDir` rather than from this package, so the project running ESLint
  must declare the React plugin set itself. The declared ranges are the versions
  this package is exercised against.

  Published as compiled ESM (`.mjs` + `.d.mts`) with source maps, one output per
  source module, `"sideEffects": false`. The ESLint configs ship as JavaScript,
  because flat config is JavaScript; their declarations are generated from the
  source's JSDoc.

### Patch Changes

- Updated dependencies [c678c77]
- Updated dependencies [22c5efb]
  - @lcabrera/eslint-plugin@0.2.0
