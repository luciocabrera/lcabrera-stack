# @lcabrera/utils

## 0.2.0

### Minor Changes

- 8bb2a24: `formatDate` accepts `timeStyle` and `timeZone`.

  Both are optional and additive — omitting them produces byte-identical output to
  before, so no existing caller changes. `getDateTimeFormatOptions` keeps its
  signature.

  `timeZone` exists because the default is the _runtime's_ zone, which differs
  between an SSR server and the browser: the same instant renders as two different
  strings and React reports a hydration mismatch. Passing an explicit zone makes
  the output deterministic on both sides. `timeStyle` pairs a time of day with the
  existing date `preset`, which previously could only produce a date.

  One behaviour note for the error path: when a caller passes `timeZone` and `Intl`
  rejects it, the fallback is now the ISO instant rather than
  `toLocaleDateString()` — that fallback reads the runtime's zone and would
  reintroduce exactly the nondeterminism such a caller is trying to remove.
  Callers that pass no `timeZone` keep the previous fallback.

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
