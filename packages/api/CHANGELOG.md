# @lcabrera/api

## 0.2.0

### Minor Changes

- fbf9d05: `buildPaginatedQueryParams` accepts an optional `cursor` — the sort-key tuple of
  the last row already loaded — and serializes it as a `cursor` search param for
  endpoints that can seek past it instead of counting `skip` rows. `skip` is still
  sent alongside, so an endpoint that does not read cursors behaves exactly as
  before.

## 0.1.1

### Patch Changes

- 287eb48: Add and update package READMEs.

  npm renders `README.md` as the package page, and `@lcabrera/api`,
  `@lcabrera/server` and `@lcabrera/ui` had none — all three pages were empty. Each
  now covers what the package is, how to install it, every subpath export, and
  worked examples.

  `@lcabrera/ui`'s leads with the constraint a consumer hits first: it ships
  TypeScript source rather than a compiled bundle, so the bundler must compile it
  and run StyleX over it.

  `@lcabrera/utils`'s install step told readers to use `workspace:*`, which only
  resolves inside this repo; its export table had also drifted four entries behind
  the `exports` map.

  A README only reaches npm with a release, so this is a patch across all four.

- Updated dependencies [287eb48]
  - @lcabrera/utils@0.1.1

## 0.1.0

### Minor Changes

- First public release.

  `@lcabrera/ui` ships React 19 components — Table, Form, Modal, Tooltip and the
  rest — styled with StyleX and built for React Router 7 loaders and actions.
  `@lcabrera/api` is the browser-safe fetch layer, `@lcabrera/server` the Node-only
  Postgres and crypto helpers, and `@lcabrera/utils` the pure helpers underneath
  both.

  These target one stack deliberately: React 19, React Router 7, StyleX, the React
  Compiler, and `pg` on the server. They are not framework-agnostic and do not try
  to be.

  `api`, `server` and `utils` are published as compiled `dist` with type
  declarations. `ui` ships TypeScript source on purpose — StyleX derives every
  custom-property name from the source path, so a consumer's own StyleX plugin has
  to compile it.

### Patch Changes

- Updated dependencies
  - @lcabrera/utils@0.1.0
