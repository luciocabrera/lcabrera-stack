# Package Architecture (`@repo/vite-configs`)

Shared Vite+ configuration builders consumed by workspace apps.

## Scope

- Provide reusable formatter, lint, packaging, and plugin configuration factories.
- Keep app-level config files minimal and focused on overrides.
- Expose stable entry points via `package.json` `exports`.

## Layers

1. Base builders: shared defaults (`fmt`).
2. Specializations: mode/app-type builders (`eslint-custom-rules`, plugins).
3. Lint: one `lint` object for the whole repo, imported by the ROOT config — per-workspace differences are `overrides` inside it (ADR-042).
4. Packaging: `pack` (`createPackConfig`) — the `vp pack`/tsdown settings for the publishable Node and browser packages.

### `pack` and the cycle it cannot cross

`createPackConfig` is shared by `@lcabrera/api` and `@lcabrera/server`, but
**`@lcabrera/utils` inlines the same settings instead of importing them**. This
package depends on `@lcabrera/utils`, so importing back — even for a plain object —
creates a workspace cycle that breaks every recursive `vp run -r` task graph. The
same constraint already governs `VITEST_COVERAGE_FLAGS` and that package's
`eslint.config.mjs`. Change one, change the other; `publish:verify` checks the
resulting `exports`, not the config that produced them.

## Design Rules

- Factory-first API: callers pass optional overrides.
- Safe defaults should work for most apps out of the box.
- Keep types permissive enough for Vite/Oxlint plugin options while avoiding `any`.
- Add new exports only when reuse across at least two apps is clear.
- Runtime-consumed ESLint config helpers may resolve app-owned dependencies from the consumer workspace when direct package resolution would be too narrow.
- Shared ESLint custom-rules config must include StyleX validation and import ordering so editor/CLI ESLint runs enforce the same critical rules as `vp lint`.
