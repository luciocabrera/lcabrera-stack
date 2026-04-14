# Build Utils Architecture

Utility plugins and scripts used by the React Router package build pipeline.

## Purpose

- Keep build-time concerns isolated from runtime application code.
- Encapsulate Vite/Rolldown-specific compatibility workarounds.
- Provide deterministic file-system behavior for build hooks.

## Current Utilities

- `fixReactRouterAssets.plugin.ts`
  - Prepares missing server CSS assets referenced by the SSR manifest before downstream rename hooks run.
  - Copies a client CSS file when available, otherwise writes an empty placeholder.

## Execution Scope

- Runs only during build tool lifecycle (`writeBundle`).
- Operates on generated artifacts in `build/server` and `build/client`.
- Does not execute in browser/runtime code paths.
