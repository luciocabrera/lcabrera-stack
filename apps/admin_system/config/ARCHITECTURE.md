# Config Architecture (admin_system app)

This directory owns app-specific Vite+ configuration wiring for the `admin_system` app.

## Responsibilities

- Export isolated config slices (`fmt`, `lint`, `plugins`, `run`).
- Keep `vite.config.ts` thin by composing pre-built config objects.
- Prefer shared config builders from workspace packages (`@lcabrera/vite-config`) and only keep app-specific overrides here.

## Files

- `vite.fmt.config.ts`: wraps shared formatter config with app ignores.
- `vite.lint.config.ts`: wraps shared lint config for React Router mode.
- `vite.plugins.config.ts`: composes plugin list via shared plugin factory and app-level overrides.
- `vite.run.config.ts`: app run-task definitions.

## Extension Rules

- Reuse `@lcabrera/vite-config` factories first.
- Add overrides in this folder only when app behavior diverges.
- Keep this layer declarative (no side effects other than config creation).
