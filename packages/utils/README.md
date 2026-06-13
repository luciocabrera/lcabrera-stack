# `@repo/utils`

> **Work in progress.** This package is a placeholder for future shared runtime utilities.

Shared TypeScript utilities for apps in this monorepo — things like merge helpers, type guards, and pure helpers with no framework dependencies.

## Install in a consumer app/package

To use this package from another workspace package (for example an app), add it to that package's `package.json`:

```json
{
  "dependencies": {
    "@repo/utils": "workspace:*"
  }
}
```

Then install dependencies from the workspace root:

```bash
vp install
```

## Adding utilities

## Current exports

```ts
import { mergeArrays, mergeObjects } from '@repo/utils/merge';
```

`mergeArrays` and `mergeObjects` are shared shallow-merge helpers used by workspace config packages.

For more granular imports as the package grows:

```ts
import { mergeArrays } from '@repo/utils/merge-arrays';
import { mergeObjects } from '@repo/utils/merge-objects';
```

`@repo/utils` is published as side-effect free (`"sideEffects": false`) to keep tree shaking effective.

Create a new `.ts` file in this directory, export what you need, and add an entry to the `exports` map in `package.json`:

```json
{
  "exports": {
    "./format": "./format.ts",
    "./guards": "./guards.ts"
  }
}
```

Then import it in any app:

```ts
import { formatCurrency } from '@repo/utils/format';
```

## Guidelines

- All functions must be **pure** — same input always produces the same output, no side effects.
- No framework imports (`react`, `vite`, etc.) — this package must stay runtime-agnostic.
- Export only named exports, never `export default`.
