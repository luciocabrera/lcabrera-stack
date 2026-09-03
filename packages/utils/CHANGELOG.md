# @lcabrera/utils

## 0.2.2

### Patch Changes

- 62bb601: Stop shipping documents a consumer cannot read, and gate the recurrence.

  `@lcabrera/ui`, `@lcabrera/server` and `@lcabrera/utils` shipped the whole
  markdown set beside their source — every `ARCHITECTURE.md`, the artifact
  inventory, the pattern guide. Those are written for a reader who has the
  repository cloned: in an install they are pages of relative links to a decisions
  directory that is not in the tarball, plus decision citations by bare number.
  `files` now carries `"!src/**/*.md"`, so the source arrives without them and the
  README states what a consumer needs, linking the rest by absolute URL.

  Every other published package carries the same negation for whichever directory
  it publishes its source from — `src`, or `scripts` for the two `.mjs` packages.
  It is inert in each of them today and changes nothing that ships, which a
  before/after comparison of every packed file list confirms. It is there
  because it is the only guard that makes a newly added `src/ARCHITECTURE.md`
  fail to ship outright, rather than merely be likely to trip the content gate on
  its way out. `@lcabrera/devkit`'s `assets` are the deliberate exception: that
  markdown is what the package exists to copy.

  `@lcabrera/repo-standards` adds `repo-verify-shipped-docs`, which packs each
  package named in `publishing.publicPackageDirs` and reads the markdown back out
  of the tarball — `files` decides its corpus, not the working tree, which is the
  only way to see a negated pattern at all. It reports a relative link that leaves
  the package, a link to a file the package does not ship, a path anchored at one
  of the author repository's own directories (`gates.shippedDocs.repoOnlyDirs`,
  defaulting to the conventional monorepo layout), and a decision cited with no
  absolute URL on the line. An empty package roster, and any package that ships no
  readable document, are refused rather than passed.

  The remaining published READMEs stop naming the repository's own tree in
  passing: the source directory each package lives in is now a link a reader can
  open.

- a26ff71: Remove the comments a declaration's name, signature and types already state,
  from every package source.

  Nothing about behaviour changes, but the removal is visible in an editor: a
  declaration's JSDoc is carried into the published `.d.mts`, so a tooltip that
  used to show a paragraph now shows the signature. What the paragraph said lives
  where it is dated — the ADR that owns the decision, or the pull request that
  made it — and the annotations a build reads (`@param`, `@returns` and the rest,
  in the JavaScript sources that ship them) are untouched, as are the one-line
  notes on a member of an exported type, which reach an installer and state what
  the member's own type cannot.

  Four declarations changed shape rather than only losing prose, because their
  only body was a comment and removing it left an empty block: `getApiBaseUrl`
  resolves a request URL through a helper instead of swallowing the parse in an
  empty `catch`, `parseVersionedPayload` and `collectPersistedStateSlices` return
  and `continue` explicitly, and the logger's no-op is an expression. Each behaves
  as it did. `collectPersistedStateSlices` also drops its `transformRaw`
  parameter, which every caller filled with the percent-decode
  `parseVersionedPayload` already performs.

  Two union member orders moved with them — `TableResponseError`'s arms and
  `AggregateItem`'s intersection — because the sort those rules apply reads the
  member's source text, and the text no longer carries a comment. A union is
  unordered to a consumer.

## 0.2.1

### Patch Changes

- 55211d7: Point `homepage`, `bugs` and `repository.url` at the repository's new name.

  The old URLs still resolve — GitHub redirects them — but only while the old name
  stays unregistered, and a published version's metadata can never be corrected in
  place. Every already-published version keeps the old URL permanently, so this is
  the first release whose links are right on their own.

  `@lcabrera/eslint-plugin` also changes what it prints into a consumer's lint
  output. ESLint shows `meta.docs.url` beside every finding, and none of the ten
  rules had a URL that resolved: eight emitted `https://example.com/rule/<name>`,
  the placeholder the first rule was scaffolded from, and two pointed at a
  `/rules/<name>` path this repository has never had. All ten now link to the
  rule's own section in the package README, which does exist, and they build that
  link from one shared factory instead of ten copies — the copies are what let
  eight of them drift.

- 9f1cc03: JSDoc on exported types is shorter. Signatures are unchanged. Comments that only
  restated a name are gone; traps and invariants stay on the line they govern
  (ADR-088).

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
