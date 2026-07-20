# Package Architecture (`@repo/utils`)

Shared framework-agnostic utility primitives — the lowest layer of the monorepo,
importable by any consumer (`@repo/ui`, `@repo/data-access`, apps).

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
- **≥95% test coverage** (statements/branches/functions/lines) gated by
  `test:coverage`; `@repo/utils` is included in the `coverage:merge` /
  `coverage-report` fan-outs.
- **Suppression-free by construction** — `eslint-suppressions.json` is gitignored
  and never committed; any real finding fails the gate.

## Config-import constraint

`@repo/vite-configs` depends on `@repo/utils`, so this package's config files
(`eslint.config.mjs`, `vite.config.ts`) must reference vite-configs helpers by
**relative path or inline** them — never via a bare `@repo/vite-configs`
specifier, which would create a workspace cycle that breaks `vp run -r`.

## Current Exports

- `./arrays/merge-arrays.util`
- `./comparison/are-arrays-equal.util` — ordered strict array equality
- `./comparison/are-equal-by-json.util` — deep structural equality via JSON
- `./comparison/is-shallow-equal.util` — one-level key/value equality
- `./errors/get-error-message.util` — narrow a caught `unknown` to its message
- `./errors/to-error.util` — normalise an `unknown` throw into a real `Error`
- `./guards/is-object.util` — narrow `unknown` to a plain object record
- `./objects/drop-nullish-values.util` — omit null/undefined entries from a record
- `./objects/merge-objects.util`
- `./strings/empty-to-undefined.util` — map an empty string to `undefined`
