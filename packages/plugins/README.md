# `@repo/plugins`

Custom Vite plugins used by apps in this monorepo.

## Exports

| Import path                          | Plugin factory         | Description                                              |
| ------------------------------------ | ---------------------- | -------------------------------------------------------- |
| `@repo/plugins/fixReactRouterAssets` | `fixReactRouterAssets` | Fixes missing CSS assets during SSR builds with Rolldown |

## `fixReactRouterAssets`

## Install in a consumer app/package

To use this package from another workspace package (for example an app), add it to that package's `package.json`:

```json
{
  "devDependencies": {
    "@repo/plugins": "workspace:*"
  }
}
```

Then install dependencies from the workspace root:

```bash
vp install
```

### Why it exists

Vite 8 / Rolldown does not emit CSS assets during SSR builds, but the server build manifest still references them. The React Router plugin then tries to rename those non-existent files from the server build output to the client build, throwing an `ENOENT` error at build time.

This plugin runs **before** React Router's `writeBundle` hook and pre-creates any missing CSS files in the server assets directory so the rename succeeds. Content is copied from the client build when a matching file exists; otherwise an empty placeholder file is created.

### Usage

```ts
// apps/react-router/vite.config.ts
import { defineConfig } from 'vite-plus';
import { fixReactRouterAssets } from '@repo/plugins/fixReactRouterAssets';
import { reactRouter } from '@react-router/dev/vite';

export default defineConfig({
  plugins: [
    fixReactRouterAssets(), // must come before reactRouter()
    reactRouter(),
  ],
});
```

### How it works

1. Reads `build/server/.vite/manifest.json` after the server bundle is written.
2. Collects all `.css` paths referenced in the manifest.
3. For each CSS path that doesn't exist under `build/server/`, creates the file — copying content from `build/client/assets/` when a CSS file is available there, or writing an empty file as a placeholder.

## Files

| File                             | Purpose                          |
| -------------------------------- | -------------------------------- |
| `fixReactRouterAssets.plugin.ts` | Plugin implementation and export |
