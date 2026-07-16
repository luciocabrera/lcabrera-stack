# AppDocument Architecture

## Purpose

The `<html>` document shell every app's `Root.layout.tsx` `Layout` export renders: head boilerplate (charset, viewport, CSP nonce meta, `<Meta>`, StyleX dev CSS injection, `<Links>`) and body wiring (`<ScrollRestoration>`/`<Scripts>` with the CSP nonce).

## Public API

- `AppDocumentProps` (`AppDocument.types.ts`)
  - `children: ReactNode`
  - `rootData?: AppDocumentRootData` — just `{ cspNonce?: string }`, not the app's full root-loader return type
  - `stylexCssHref: string` — the app's own compiled StyleX stylesheet URL

## Why `rootData` and `stylexCssHref` stay props, not sourced here

- `rootData` comes from `useRouteLoaderData<typeof rootLoader>('root')` in the app's own `Root.layout.tsx` — `rootLoader`'s type is app-specific, so this component only declares the minimal shape it actually reads (`cspNonce`), not the app's full loader type.
- `stylexCssHref` is a per-app build artifact (`import stylexCssHref from '../stylex.css?url'`, a Vite `?url` import resolved relative to each app's own `src/`) — there is no single compiled stylesheet this package could import on every consuming app's behalf, since each app compiles its own.

## File Structure

- `AppDocument.component.tsx` — component implementation
- `AppDocument.types.ts` — public props contract
- `AppDocument.component.test.tsx` — tests
- `index.ts` — explicit barrel exports
