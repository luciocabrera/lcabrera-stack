# `@repo/ts-configs`

Shared TypeScript configuration generator for all apps in this monorepo. Instead of using `extends` chains (which still require a file per app), this package uses **code generation** — a single TypeScript source of truth that writes `tsconfig.app.json` / `tsconfig.node.json` into every app directory.

## How it works

```
tsconfig.shared.ts          ← edit this to change any compiler option
        │
        ▼  node --experimental-strip-types generate.ts
        │
        ├── packages/ts-configs/tsconfig.app.json
        ├── packages/ts-configs/tsconfig.node.json
        ├── apps/react-router/tsconfig.app.json    ← generated
        ├── apps/react-router/tsconfig.node.json   ← generated
        ├── apps/admin_system/tsconfig.app.json    ← generated
        └── apps/admin_system/tsconfig.node.json   ← generated
```

Each app keeps a thin hand-written `tsconfig.json` that only holds project references:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

The `tsconfig.app.json` and `tsconfig.node.json` files are **build artifacts** — don't edit them by hand.

## Config variants

| Config               | Used for                                 | Key features                                                                  |
| -------------------- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| `createAppTsConfig`  | React / browser apps                     | `jsx: react-jsx`, `DOM` libs, `@/*` path alias, `.react-router/types` rootDir |
| `createNodeTsConfig` | Node.js configs (`vite.config.ts`, etc.) | No JSX, `types: ["node"]`, minimal lib                                        |

## Running the generator

## Install in a consumer app/package

To use this package from another workspace package (for example an app), add it to that package's `package.json`:

```json
{
  "devDependencies": {
    "@repo/ts-configs": "workspace:*"
  }
}
```

Then install dependencies from the workspace root:

```bash
vp install
```

```bash
# From the workspace root
node --experimental-strip-types packages/ts-configs/generate.ts

# Or via the package script
cd packages/ts-configs && vp run generate
```

Run this whenever you change `tsconfig.shared.ts` or add a new app.

## Adding a new app

Open `generate.ts` and add two entries to the `configs` array — one for `tsconfig.app.json` and one for `tsconfig.node.json`:

```ts
{
  config: createAppTsConfig({
    tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
  }),
  filePath: resolve(workspaceRoot, 'apps/my-new-app/tsconfig.app.json'),
},
{
  config: createNodeTsConfig({
    tsBuildInfoFile: './node_modules/.tmp/tsconfig.node.tsbuildinfo',
  }),
  filePath: resolve(workspaceRoot, 'apps/my-new-app/tsconfig.node.json'),
},
```

Then re-run the generator.

## Customising per-app

Both factory functions accept optional `include`, `exclude`, and `rootDirs` overrides if an app needs something non-standard:

```ts
createAppTsConfig({
  tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
  include: ['src', 'custom-dir'],
  exclude: ['dist'],
  rootDirs: ['.', './.react-router/types', './extra-types'],
});
```

## Files

| File                 | Purpose                                                      |
| -------------------- | ------------------------------------------------------------ |
| `tsconfig.shared.ts` | Source of truth — all compiler options and factory functions |
| `generate.ts`        | Script that writes JSON files into every app                 |
| `tsconfig.app.json`  | Generated — app config for this package itself               |
| `tsconfig.node.json` | Generated — node config for this package itself              |
