# Package Architecture (`@lcabrera/utils`)

Shared framework-agnostic utility primitives — the lowest layer of the monorepo,
importable by any consumer (`@lcabrera/ui`, `@lcabrera/server`, apps).

## Design Goals

- Keep utilities **pure** and side-effect free (`types: []` in tsconfig denies
  Node ambient globals to protect the guarantee).
- Preserve tree-shaking friendliness as the package grows.
- Expose narrow subpath exports so consumers import only what they need.

## Structure

- Sources live under `src/`, **grouped by domain** (`arrays/`, `objects/`,
  `strings/`, `numbers/`, `guards/`, `errors/`, `formatters/`, …).
- **One utility per kebab-case `*.util.ts` file** with a colocated
  `*.util.test.ts`.
- **Explicit per-file subpath exports** (no wildcards) — each helper gets its own
  `exports` entry (`./<domain>/<name>.util`), so consumers import exactly what
  they need and tree-shaking stays effective.

## Quality Bar (public-package tier)

- **kebab-case `*.util.ts`** enforced via the `filename-convention` rule's
  `suffixCase: { util: 'kebab-case' }` option — asserted, not silenced.
- **≥95% test coverage** (statements/branches/functions/lines), declared in
  `test.coverage.thresholds` in `vite.config.ts` and enforced by any coverage
  run, `test:coverage` included; `@lcabrera/utils` is included in the
  `coverage:merge` / `coverage-report` fan-outs.
- **Suppression-free by construction** — `eslint-suppressions.json` is gitignored
  and never committed; any real finding fails the gate.

## Config imports: the cycle is gone

These config files (`eslint.config.mjs`, `vite.config.ts`) used to inline the
shared pack/coverage settings and reach the ESLint factory by relative path,
because the config package declared `@lcabrera/utils` as a devDependency and a
bare specifier back would have closed a workspace cycle.
[ADR-069](../../docs/decisions/ADR-069-publish-the-shared-toolchain.md) dropped
that edge — there was no import site for it — so both now import
`@lcabrera/vite-config` by name like every other workspace. The 95% coverage
thresholds stay local, in this package's `test.coverage.thresholds`: they are
its own gate, not a shared value.

## Current Exports

- `./arrays/merge-arrays.util`
- `./chart/band-path.util` — SVG path data for a band between a lower and an upper bound
- `./chart/chart.types` — point, band, domain, range and scale types shared by the chart helpers
- `./chart/decimate.util` — thin a series to a threshold with largest-triangle-three-buckets
- `./chart/format-path-point.util` — write an `x,y` pair rounded to two decimal places
- `./chart/line-path.util` — SVG path data through a series, broken at each missing value
- `./chart/nice-ticks.util` — axis ticks at one, two, five or ten times a power of ten
- `./chart/scale-linear.util` — map a numeric domain onto a range, optionally clamped
- `./chart/scale-time.util` — map a `Date` domain onto a range, optionally clamped
- `./comparison/are-arrays-equal.util` — ordered strict array equality
- `./comparison/are-equal-by-json.util` — deep structural equality via JSON
- `./comparison/is-shallow-equal.util` — one-level key/value equality
- `./errors/get-error-message.util` — narrow a caught `unknown` to its message
- `./errors/to-error.util` — normalise an `unknown` throw into a real `Error`
- `./formatters/format-currency.util` — locale/currency-aware money formatting
- `./formatters/format-date.util` — preset-based date formatting
- `./formatters/format-number.util` — locale-aware number formatting
- `./formatters/formatters.types` — shared `Intl`-formatter option types
- `./formatters/formatters.constants` — default locale/currency/date-preset
- `./formatters/get-date-time-format-options.util` — preset → `Intl` date options
- `./formatters/get-default-locale.util` — resolve the runtime default locale
- `./formatters/parse-date.util` — coerce a date-like input to a `Date`
- `./forms/is-checkbox-checked.util` — strict `'on'` checkbox read from `FormData`
- `./forms/read-form-string.util` — read a named `FormData` text value (or `''`)
- `./guards/is-object.util` — narrow `unknown` to a plain object record
- `./guards/is-non-empty-array.util` — narrow an array to a tuple with a first element
- `./json/safe-json-parse.util` — parse JSON, returning `undefined` instead of throwing
- `./numbers/parse-positive-integer.util` — parse a non-negative integer with a fallback
- `./numbers/round-to-cents.util` — round a monetary amount to two decimal places
- `./objects/drop-nullish-values.util` — omit null/undefined entries from a record
- `./objects/merge-objects.util`
- `./strings/empty-to-undefined.util` — map an empty string to `undefined`
