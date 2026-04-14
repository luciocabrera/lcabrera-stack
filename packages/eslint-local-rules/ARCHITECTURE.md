# Shared ESLint Local Rules Architecture

Centralized custom ESLint rules used across monorepo apps.

## Purpose

- Provide one canonical source for custom linting behavior.
- Separate global TypeScript rules from React-only rules via consuming app configs.
- Avoid rule drift between apps.

## Layout

- `index.ts` - plugin registration for all custom rules.
- `*.ts` - rule source files.
- `build/*.js` - compiled runtime plugin files consumed by lint configs.
- `index.js` - runtime export that forwards to `build/index.js`.
- `tsconfig.json` - compile config for plugin build output.

## Rule Scope Model

- Global-eligible rules:
  - `destructuring-for-functions`
  - `merge-duplicate-imports`
  - `no-inline-type-imports`
  - `type-suffix-naming`
- React-only rules (enabled only in React app lint overrides):
  - `no-type-definitions-in-components`
  - `single-component-export`

## Build and Consumption

- Build with: `tsc -p tsconfig.json`
- Consumed by app lint config as plugin specifier path:
  - `../../packages/eslint-local-rules/index.js` from app roots.

## Guardrails

- Rule IDs remain stable under `local-rules/*` so existing inline disable comments continue working.
- React-only behavior is controlled by consuming app file globs, not by duplicating plugin implementations.
