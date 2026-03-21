# vite-react-compiler

React 19 + TypeScript + StyleX + React Router 7 application with SSR support,
built on Vite+.

## Overview

- React 19 with React Compiler
- React Router 7 loaders/actions and SSR
- StyleX-only styling
- Vite+ workflow with task definitions for build, start, and test
- Enterprise-style table implementation with virtualization, persistence, and
  infinite scrolling

## Requirements

- Node.js
- `vp` installed and available on PATH

## Install

```bash
vp install
```

## Main Commands

```bash
# Development app server
vp dev

# Production SSR build
vp run build

# Start production SSR server
vp run start

# Run tests
vp run test

# Watch tests
vp run test:watch

# Full validation
vp check
vp run test
```

## Important Command Notes

- Use `vp run build`, not `vp build`, for the production SSR bundle.
- `vp run build` emits `build/server/index.js`.
- `vp run start` serves `build/server/index.js` and rebuilds it if missing.
- Use `vp run test`, not `vp test`, because this repo uses a custom Vitest
  command to avoid the Vite+ built-in test-path issue in this setup.

## API Server

The frontend proxies `/api` requests to `http://localhost:3001`.

Start the API server from the nested workspace package:

```bash
cd api-server
vp run start
```

## Routes

Key routes currently available:

- `/`
- `/settings`
- `/car-sales`
- `/car-sales-infinite`
- `/enterprise-orders`
- `/wide-alltypes-150`

## Build Output

Production builds generate:

- `build/client/*` for browser assets
- `build/server/index.js` for the SSR server entry

## Project Structure

```text
src/
  components/
  contexts/
  design-system/
  hooks/
  routes/
  services/
  types/
  utils/
api-server/
docs/
```

## Quality Gate

Use this sequence before finishing changes:

```bash
vp check
vp run test
```

## Related Docs

- `AGENTS.md`
- `CLAUDE.md`
- `GEMINI.md`
- `src/routes/enterprise-orders/README.md`
