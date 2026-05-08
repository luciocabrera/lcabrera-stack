# GlobalSettingsContext Architecture

App-level store-backed context for global user preferences persisted in cookies and hydrated via SSR.

## Purpose

- Expose global settings state with selector/action hooks.
- Keep preferences available across routes and table instances.
- Persist preferences to cookie through existing persist-cookie server action.

## Initial Scope

- Global pinning preferences:
  - preferred pin side
  - preferred pin-conflict resolution
  - preferred unpin-conflict resolution
- Global navigation preferences:
  - preferred initial expansion (`expanded`, `collapsed`)
  - preferred initial pin mode (`pinned`, `unpinned`)
  - preferred navigation size (`compact`, `small`, `medium`, `large`)

## Design

- Context value contains one `settingsStore` created via `useStore`.
- Selector hooks subscribe via `useSyncExternalStore`.
- Action hooks read one snapshot per execution and write immutable patches.
- SSR hydration comes from root loader cookie read.

## Persistence

- Single cookie key stores versioned JSON for global settings.
- Writes use `/_action/persist-cookie` to support SSR Set-Cookie behavior.
