# `@repo/utils`

Shared, framework-agnostic **pure** utilities for the monorepo — the lowest
layer, importable by any consumer (`@repo/ui`, `@repo/data-access`, apps). No
React/DOM/StyleX, no `fetch`/`node:*`/`pg`/db, no side effects.

## Install in a consumer app/package

Add it to that workspace's `package.json`:

```json
{
  "dependencies": {
    "@repo/utils": "workspace:*"
  }
}
```

Then install from the workspace root:

```bash
vp install
```

## Current exports

Sources live under `src/`, grouped by domain, with an explicit per-file subpath
export for each helper:

```ts
import { mergeArrays } from '@repo/utils/arrays/merge-arrays.util';
import { mergeObjects } from '@repo/utils/objects/merge-objects.util';
```

`mergeArrays` and `mergeObjects` are shared shallow-merge helpers used by the
workspace config packages. `@repo/utils` is side-effect free
(`"sideEffects": false`) to keep tree-shaking effective.

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
import { slugify } from '@repo/utils/strings/slugify.util';
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
