# Package Architecture (`@repo/utils`)

Shared framework-agnostic utility primitives for workspace packages.

## Design Goals

- Keep utilities pure and side-effect free.
- Preserve tree-shaking friendliness as the package grows.
- Expose narrow subpath exports so consumers can import only what they need.

## Export Strategy

- Prefer one utility per file.
- Export each utility with a dedicated subpath (for example `./merge-arrays`).
- Keep grouped compatibility entrypoints when migration safety matters (for example `./merge`).

## Current Exports

- `./merge` (compatibility entrypoint)
- `./merge-arrays`
- `./merge-objects`
