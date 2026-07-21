# Shared ESLint Local Rules Architecture

Centralized custom ESLint rules used across monorepo apps.

## Purpose

- Provide one canonical source for custom linting behavior.
- Separate global TypeScript rules from React-only rules via consuming app configs.
- Avoid rule drift between apps.

## Layout

- `index.ts` - plugin registration for all custom rules.
- `*.ts` - rule source files.
- `*.test.ts` - colocated `RuleTester` suite, one per rule (see Testing below).
- `component-files.ts` - shared definition of which filename suffixes mark a
  component file, used by every rule that gates on one.
- `build/*.js` - compiled runtime plugin files consumed by lint configs.
- `index.js` - runtime export that forwards to `build/index.js`.
- `tsconfig.json` - typecheck config; includes the tests.
- `tsconfig.build.json` - build config; excludes the tests so vitest does not
  collect a source test and its compiled twin.

## Rule Scope Model

- Global-eligible rules:
  - `clean-import-paths`
  - `destructuring-for-functions`
  - `filename-convention`
  - `merge-duplicate-imports`
  - `no-inline-type-imports`
  - `type-suffix-naming`
- React-only rules (enabled only in React app lint overrides):
  - `no-type-definitions-in-components`
  - `readonly-props`
  - `single-component-export`

## Testing

Every rule has a colocated `<rule>.test.ts` driving `@typescript-eslint/rule-tester`,
and `rules-have-tests.test.ts` fails the suite if one is missing.

That invariant is not bureaucracy. Four of these rules decide whether to run at
all from a filename suffix (`.component.tsx`, `.layout.tsx`, `.error-boundary.tsx`,
`.tsx`), so moving a naming convention can turn a rule into a silent no-op — and
a dead rule reports exactly what compliant code reports: nothing. That is what
happened to `no-type-definitions-in-components`, which went on matching the
camelCase `.errorBoundary.tsx` spelling after `filename-convention` had replaced
it, and so fired on none of the repo's error boundaries.

A filename-gated rule must therefore assert **both sides of its gate**: the same
source is `invalid` under a matching filename and `valid` under a non-matching
one. A test that only checks the violation cannot tell a working rule from a
dead one.

## Build and Consumption

- Build with: `tsc -p tsconfig.build.json` (`vp run --filter eslint-local-rules-shared build`)
- Consumed by the shared ESLint flat-config helper:
  - `packages/vite-configs/eslint.custom-rules.shared.config.mjs`
- App roots consume that helper via:
  - `@repo/vite-configs/eslint-custom-rules`

## Guardrails

- Rule IDs remain stable under `local-rules/*` so existing inline disable comments continue working.
- React-only behavior is controlled by consuming app file globs, not by duplicating plugin implementations.
