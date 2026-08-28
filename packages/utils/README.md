# `@lcabrera/utils`

Shared, framework-agnostic **pure** utilities for the monorepo — the lowest
layer, importable by any consumer (`@lcabrera/ui`, `@lcabrera/server`, apps). No
React/DOM/StyleX, no `fetch`/`node:*`/`pg`/db, no side effects.

## Install

```bash
npm install @lcabrera/utils
```

No dependencies and no peer dependencies.

Inside this monorepo, depend on it with `"@lcabrera/utils": "workspace:*"` and
run `vp install` from the root.

## Current exports

Sources live under `src/`, grouped by domain, with an explicit per-file subpath
export for each helper:

| Domain       | Helper                                                                                  | Import                                                         |
| ------------ | --------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `arrays`     | `mergeArrays`                                                                           | `@lcabrera/utils/arrays/merge-arrays.util`                     |
| `comparison` | `areArraysEqual`                                                                        | `@lcabrera/utils/comparison/are-arrays-equal.util`             |
| `comparison` | `areEqualByJson`                                                                        | `@lcabrera/utils/comparison/are-equal-by-json.util`            |
| `comparison` | `isShallowEqual`                                                                        | `@lcabrera/utils/comparison/is-shallow-equal.util`             |
| `errors`     | `getErrorMessage`                                                                       | `@lcabrera/utils/errors/get-error-message.util`                |
| `errors`     | `toError`                                                                               | `@lcabrera/utils/errors/to-error.util`                         |
| `formatters` | `formatCurrency`                                                                        | `@lcabrera/utils/formatters/format-currency.util`              |
| `formatters` | `formatDate`                                                                            | `@lcabrera/utils/formatters/format-date.util`                  |
| `formatters` | `formatNumber`                                                                          | `@lcabrera/utils/formatters/format-number.util`                |
| `formatters` | `parseDate`                                                                             | `@lcabrera/utils/formatters/parse-date.util`                   |
| `formatters` | `getDateTimeFormatOptions`                                                              | `@lcabrera/utils/formatters/get-date-time-format-options.util` |
| `formatters` | `getDefaultLocale`                                                                      | `@lcabrera/utils/formatters/get-default-locale.util`           |
| `formatters` | `DEFAULT_CURRENCY`, `DEFAULT_DATE_PRESET`, `DEFAULT_LOCALE`                             | `@lcabrera/utils/formatters/formatters.constants`              |
| `formatters` | `CurrencyFormatOptions`, `DateFormatOptions`, `DateFormatPreset`, `NumberFormatOptions` | `@lcabrera/utils/formatters/formatters.types`                  |
| `forms`      | `isCheckboxChecked`                                                                     | `@lcabrera/utils/forms/is-checkbox-checked.util`               |
| `forms`      | `readFormString`                                                                        | `@lcabrera/utils/forms/read-form-string.util`                  |
| `guards`     | `isObject`                                                                              | `@lcabrera/utils/guards/is-object.util`                        |
| `json`       | `safeJsonParse`                                                                         | `@lcabrera/utils/json/safe-json-parse.util`                    |
| `numbers`    | `parsePositiveInteger`                                                                  | `@lcabrera/utils/numbers/parse-positive-integer.util`          |
| `numbers`    | `roundToCents`                                                                          | `@lcabrera/utils/numbers/round-to-cents.util`                  |
| `objects`    | `dropNullishValues`                                                                     | `@lcabrera/utils/objects/drop-nullish-values.util`             |
| `objects`    | `mergeObjects`                                                                          | `@lcabrera/utils/objects/merge-objects.util`                   |
| `strings`    | `emptyToUndefined`                                                                      | `@lcabrera/utils/strings/empty-to-undefined.util`              |

```ts
import { getErrorMessage } from '@lcabrera/utils/errors/get-error-message.util';
import { isShallowEqual } from '@lcabrera/utils/comparison/is-shallow-equal.util';
```

`@lcabrera/utils` is side-effect free (`"sideEffects": false`) to keep tree-shaking
effective; each helper is a standalone subpath so consumers pull in exactly one.
It is published as compiled ESM (`.mjs` + `.d.mts`) with source maps, mirroring
the source tree one file per module.

## Adding a utility

Create a **kebab-case** `*.util.ts` file under the matching domain folder in
`src/` (e.g. `src/strings/`, `src/guards/`) with a colocated `*.util.test.ts`,
then add an explicit subpath to the `exports` map in `package.json`:

```json
{
  "exports": {
    "./strings/slugify.util": "./src/strings/slugify.util.ts"
  }
}
```

Then import it anywhere:

```ts
import { slugify } from '@lcabrera/utils/strings/slugify.util';
```

## Guidelines

- All functions must be **pure** — same input → same output, no side effects,
  no argument mutation.
- **No framework imports** (`react`, `vite`, `pg`, `node:*`, …) — this package
  stays runtime-agnostic and browser-or-server safe. `tsconfig` denies Node
  ambient globals (`types: []`) so a stray `process`/`fs` reach-in fails typecheck.
- **Named exports only**, never `export default`.
- **kebab-case `*.util.ts`, one util per file**, grouped by domain under `src/`.
  Enforced by `local-rules/filename-convention` via its `suffixCase` option (the
  rule stays live — a camelCase `.util` here fails the gate; it is not turned off).
- **≥95% coverage** (statements/branches/functions/lines), gated by
  `test:coverage`. This is a public-facing package: it never baselines and is
  suppression-free by construction (its `eslint-suppressions.json` is gitignored).

## Links

- [Repository](https://github.com/luciocabrera/lcabrera-stack) ·
  [this package's source](https://github.com/luciocabrera/lcabrera-stack/tree/main/packages/utils)
- [Changelog](https://github.com/luciocabrera/lcabrera-stack/blob/main/packages/utils/CHANGELOG.md)
- Companion packages: [`@lcabrera/api`](https://www.npmjs.com/package/@lcabrera/api)
  (browser HTTP), [`@lcabrera/server`](https://www.npmjs.com/package/@lcabrera/server)
  (Node + Postgres), [`@lcabrera/ui`](https://www.npmjs.com/package/@lcabrera/ui)
  (React components)

MIT © Lucio Cabrera
