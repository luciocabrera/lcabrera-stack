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
| `chart`      | `bandPath`                                                                              | `@lcabrera/utils/chart/band-path.util`                         |
| `chart`      | `decimate`                                                                              | `@lcabrera/utils/chart/decimate.util`                          |
| `chart`      | `formatPathPoint`                                                                       | `@lcabrera/utils/chart/format-path-point.util`                 |
| `chart`      | `linePath`                                                                              | `@lcabrera/utils/chart/line-path.util`                         |
| `chart`      | `niceTicks`                                                                             | `@lcabrera/utils/chart/nice-ticks.util`                        |
| `chart`      | `scaleLinear`                                                                           | `@lcabrera/utils/chart/scale-linear.util`                      |
| `chart`      | `scaleTime`                                                                             | `@lcabrera/utils/chart/scale-time.util`                        |
| `chart`      | `ChartBandPoint`, `ChartDomain`, `ChartPoint`, `ChartRange`, `ChartScale`, `ChartValue` | `@lcabrera/utils/chart/chart.types`                            |
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
| `guards`     | `isFiniteNumber`                                                                        | `@lcabrera/utils/guards/is-finite-number.util`                 |
| `guards`     | `isStringList`                                                                          | `@lcabrera/utils/guards/is-string-list.util`                   |
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
The `chart` helpers are the geometry of a chart and draw nothing themselves: a
scale maps a value onto a pixel range (`scaleLinear`, or `scaleTime` for `Date`
values, either one optionally clamped), `niceTicks` picks axis ticks at one, two
or five times a power of ten, `linePath` and `bandPath` return SVG path data
that breaks at a missing, `null` or non-finite value, and `decimate` thins a long
series with largest-triangle-three-buckets. They read no DOM, so a chart drawn
with them renders the same markup on the server and the client.

```ts
import { linePath } from '@lcabrera/utils/chart/line-path.util';
import { scaleLinear } from '@lcabrera/utils/chart/scale-linear.util';

const x = scaleLinear({ domain: [0, 2], range: [0, 80] });
const y = scaleLinear({ domain: [1, 5], range: [20, 0] });

linePath({
  points: [
    { x: 0, y: 1 },
    { x: 1, y: 5 },
    { x: 2, y: 2 },
  ],
  x,
  y,
}); // 'M0,20L40,0L80,15'
```

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
- **≥95% coverage** (statements/branches/functions/lines), declared in
  `test.coverage.thresholds` in `vite.config.ts`, so every coverage run
  enforces it, `test:coverage` included. This is a public-facing package: it
  never baselines and is suppression-free by construction (its
  `eslint-suppressions.json` is gitignored).

## Links

- [Repository](https://github.com/luciocabrera/lcabrera-stack) ·
  [this package's source](https://github.com/luciocabrera/lcabrera-stack/tree/main/packages/utils)
- [Changelog](https://github.com/luciocabrera/lcabrera-stack/blob/main/packages/utils/CHANGELOG.md)
- Companion packages: [`@lcabrera/api`](https://www.npmjs.com/package/@lcabrera/api)
  (browser HTTP), [`@lcabrera/server`](https://www.npmjs.com/package/@lcabrera/server)
  (Node + Postgres), [`@lcabrera/ui`](https://www.npmjs.com/package/@lcabrera/ui)
  (React components)

MIT © Lucio Cabrera
