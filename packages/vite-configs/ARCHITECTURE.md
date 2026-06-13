# Package Architecture (`@repo/vite-configs`)

Shared Vite+ configuration builders consumed by workspace apps.

## Scope

- Provide reusable formatter, lint, and plugin configuration factories.
- Keep app-level config files minimal and focused on overrides.
- Expose stable entry points via `package.json` `exports`.

## Layers

1. Base builders: shared defaults (`fmt`, `base-lint`).
2. Specializations: mode/app-type builders (`api-lint`, `frontend-lint`, `react-router-lint`, plugins).
3. Merge helpers: reusable merge utilities for override behavior.

## Design Rules

- Factory-first API: callers pass optional overrides.
- Safe defaults should work for most apps out of the box.
- Keep types permissive enough for Vite/Oxlint plugin options while avoiding `any`.
- Add new exports only when reuse across at least two apps is clear.
