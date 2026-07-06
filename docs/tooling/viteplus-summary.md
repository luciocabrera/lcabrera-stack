# Vite+ (viteplus) — Summary

> Sources: <https://viteplus.dev/guide/#execute>, <https://viteplus.dev/guide/run>, <https://viteplus.dev/guide/monorepo> (fetched 2026-07-06)

## What is Vite+

Vite+ is "the unified toolchain and entry point for web development." It integrates Vite, Vitest, Oxlint, Oxfmt, Rolldown, tsdown, and Vite Task into a single system that manages the runtime, the package manager, and the frontend toolchain together.

Core lifecycle commands:

```bash
vp create     # Create a new project
vp install    # Install dependencies
vp dev        # Start dev server
vp check      # Format, lint, type-check
vp test       # Run JavaScript tests
vp build      # Build for production
```

Built-in commands cannot be customized. Custom `package.json` scripts run via `vp run <command>` (shorthand: `vpr <command>`).

## Execute commands

The Execute category covers task running and binary execution:

| Command          | Purpose                                                          |
| ---------------- | ---------------------------------------------------------------- |
| `vp run` / `vpr` | Run tasks across workspaces with caching                         |
| `vp exec`        | Run local project binaries                                       |
| `vp node`        | Execute Node.js scripts with the resolved Vite+ environment      |
| `vp dlx`         | Download and run a package binary without permanent installation |
| `vpx`            | Download and run binaries globally                               |
| `vp cache clean` | Clear task cache entries                                         |

## `vp run` — task runner

`vp run` executes `package.json` scripts and tasks defined in `vite.config.ts`, with built-in caching, dependency ordering, and workspace awareness.

```bash
vp run build                    # Run a specific script/task
vp run                          # Interactive task selector
vp run --cache build            # Enable caching for a script
```

### Task definition (vite.config.ts)

```ts
run: {
  tasks: {
    build: {
      command: 'vp build',
      dependsOn: ['lint'],   // task dependencies
      env: ['NODE_ENV'],     // env vars that affect the cache key
      // cache: true/false   // per-task cache control
    },
  },
}
```

Key caching semantics:

- Tasks defined in `vite.config.ts` **cache by default**; `package.json` scripts **don't**.
- Compound commands (joined with `&&`) split into independent cached tasks.
- Nested `vp run` calls inline as separate tasks rather than spawning processes.
- Inspect cache performance with `-v` or `--last-details`.

### Workspace execution flags

- `-r` (recursive): run across all workspace packages in dependency order.
- `-t` (transitive): run in one package plus all its dependencies.
- `-w` (workspace root): target only the root package.
- `--filter`: pnpm-style selection by name, glob, or directory:

```bash
vp run --filter @my/app build
vp run --filter "@my/*" build
vp run --filter "./packages/app" build
```

### Concurrency

Default is 4 concurrent tasks.

```bash
vp run -r --concurrency-limit 8 build   # Raise the limit
vp run -r --parallel dev                # Ignore dependencies, unlimited concurrency
```

## Monorepo support

- A root `vite.config.ts` defines shared defaults; "you can define the defaults for `lint`, `fmt`, etc. at the root, and use `overrides` to apply package-specific lint and format settings."
- Individual packages keep their own `vite.config.ts` only for framework/runtime specifics.
- Config is plain JavaScript — compose it with regular imports.

### Lint overrides (glob-scoped from the root)

```ts
lint: {
  plugins: ['typescript'],
  overrides: [
    {
      files: ['apps/web/**', 'packages/ui/**'],
      plugins: ['typescript', 'react'],
      rules: { 'react/self-closing-comp': 'error' },
    },
    {
      files: ['apps/api/**'],
      env: { node: true },
      rules: { 'no-console': 'off' },
    },
  ],
}
```

### Format overrides

```ts
fmt: {
  singleQuote: true,
  overrides: [
    { files: ['apps/api/**'], options: { printWidth: 120 } },
  ],
}
```

### Config composition

```ts
// tooling/lint/react.ts
export const reactLint = {
  plugins: ['typescript', 'react'],
  rules: { 'react/self-closing-comp': 'error' },
};

// vite.config.ts
import { reactLint } from './tooling/lint/react';
export default defineConfig({
  lint: {
    overrides: [{ files: ['apps/web/**'], ...reactLint }],
  },
});
```

### Workspace task execution

```bash
vp dev apps/web
vp build apps/web
vp run -r build              # Recursive, dependency order
vp run -r --parallel dev     # Parallel dev servers
vp run --filter ./apps/web build
```

## Best practices

1. Share lint/fmt configuration at the root; use `overrides` for package-specific rules.
2. Keep app-specific dev/build behavior in individual packages or targeted commands.
3. Define tasks in `vite.config.ts` when caching or dependency control is needed (`dependsOn` supports `{ task, from: 'dependencies' }` to build all workspace dependencies before e.g. testing).
4. Use `--filter` for targeted monorepo operations instead of recursive runs.
5. Maintain package-level scripts when commands differ significantly per application.

## How this repo maps to the guidance

- Root [vite.config.ts](../../vite.config.ts) uses `defineConfig` from `vite-plus` with shared `fmt` config composed from `@repo/vite-configs` — the documented composition pattern.
- Shared lint/fmt/run fragments live in [packages/vite-configs/](../../packages/vite-configs/).
- Versions are pinned through the pnpm `catalog:` in [pnpm-workspace.yaml](../../pnpm-workspace.yaml).
- All operations go through `vp` (never pnpm/npm/yarn directly) per [AGENTS.md](../../AGENTS.md).
