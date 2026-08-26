# @lcabrera/eslint-plugin

## 0.3.0

### Minor Changes

- ff3a7cb: New rule `no-habit-return-types`, enabled in both shared ESLint configs.

  It removes a return-type annotation TypeScript would have written itself, and it
  is auto-fixable. An explicit return type is sometimes deliberate — it can promise
  callers **less** than the function really returns — and that is indistinguishable
  in the source text from a redundant one. Telling them apart needs a type checker,
  which this plugin does not have.

  So the rule reports only annotations that cannot be hiding anything, because the
  body shape fixes the inferred type exactly: `void` and `Promise<void>` on a block
  body that returns no value and whose end point is plainly reachable, `boolean`
  where every return carries a comparison or a boolean literal, and `JSX.Element`
  where every return carries JSX — both under the same reachability condition,
  because a body that can fall off its end returns `undefined` on that path and
  inference gives `T | undefined`. Everywhere else it is silent — so a
  deliberate widening is never flagged, and the rule has no options and nothing to
  disable.

  The `void` arms ask whether the body can reach its bottom, because that is the
  question that separates `void` from `never`: TypeScript infers `never` for a
  function that neither returns nor reaches its bottom, so an annotation there is
  widening `never` to `void` and must not be removed. An `if`/`else` where both
  arms throw, a `switch` whose `default` throws, `for (;;)` and a throwing
  `finally` all make the bottom unreachable, while a guard clause — `if (bad)
{ throw … }` — does not, and is reported.

  **One case is out of reach and stays wrong.** A call to a function declared
  `(): never` also makes the bottom unreachable, so `(): void => { process.exit(1); }`
  infers `never` and this rule removes the annotation anyway. Deciding it means
  resolving the callee's signature, which needs a type checker this plugin does not
  have. The rule is auto-fixable and has nothing to disable, so if you meet this the
  annotation has to be restored by hand. Closing it properly needs a type-aware
  rule; it is stated here rather than left to be found.

  **Consumers of `@lcabrera/vite-config` get this as an error on their next
  upgrade.** It is auto-fixable, so `eslint --fix` clears it; the findings it
  raises are annotations their own compiler already reproduces.

  The trade is deliberate: `(): string` over a body returning a `string` is a habit
  this rule will not catch, because the same annotation over a body returning
  `'a' | 'b'` is a widening.

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

## 0.2.0

### Minor Changes

- c678c77: New rule `domain-folder-filename` — enforces **where** a shared `*.types.ts` /
  `*.constants.ts` may live and what it must be called, so a codebase's folder
  convention is asserted rather than remembered.

  Three folder shapes exist and only one takes the rule: a **domain** folder,
  whose name _is_ the subject, names the file after the folder
  (`filters/filters.types.ts`); an **artifact** folder, holding one component,
  context or route module, names it after the artifact
  (`TableConfig/TableConfigContext.types.ts`); a **catch-all** folder names a
  _kind_, not a subject, so the file is named after its own subject
  (`types/theme.types.ts`). "Exactly one `*.constants.ts` per domain folder" then
  follows from the naming rather than being counted, because two files in one
  folder cannot both be `<folder>.constants.ts`.

  Telling the shapes apart from the path is the whole difficulty, and the obvious
  discriminator is not enough: PascalCase separates a component folder from a
  domain folder but not a route one — `trigger-scan/` and `group-query-builder/`
  are both kebab-case, and only the first may name a file after its contents. So
  the rule treats a PascalCase folder as an artifact folder and exempts an
  `artifactFolders` subtree (default `routes`) outright. It deliberately does not
  stat the filesystem for a marker file: that is neither hermetic nor cheap in a
  lint rule, and on the codebase this was measured against, path-only
  classification matched the directory-reading version exactly.

  Three options, each replacing its default wholesale rather than extending it:
  `artifactFolders`, `catchAllFolders`, and `pairedSuffixes` (default
  `['constants', 'types']`).

  This ships as a **separate rule** rather than an option on
  `filename-convention`, so upgrading does not change what an existing consumer's
  build reports: a new rule is opt-in, a widened one is not.

- 22c5efb: The repo's custom ESLint rules are now a published package,
  `@lcabrera/eslint-plugin`. It carries the rules that enforce conventions no other
  linter checks: filename case per type suffix, clean internal import paths,
  readonly `*Props` members, one component per component file, `Args`/`Props` type
  suffixes, object parameters past two arguments, and separated type imports.

  Flat-config only, `eslint` v9+ as a peer. The plugin is registered under a key
  you choose, so the rule prefix is yours rather than the package name's:

  ```js
  import localRules from '@lcabrera/eslint-plugin';

  export default [
    {
      files: ['**/*.ts', '**/*.tsx'],
      plugins: { 'local-rules': localRules },
      rules: { 'local-rules/readonly-props': 'error' },
    },
  ];
  ```

  There is deliberately no `recommended` preset. Several of these rules encode a
  house style rather than a correctness property, and a preset would imply the set
  travels together when it does not — `clean-import-paths` strips import
  extensions, which is wrong in any project compiling with tsc under NodeNext,
  where they are required.

  The two rules that previously hardcoded this repository's own conventions now
  take options with those conventions as defaults, so behaviour is unchanged here
  and configurable everywhere else: `clean-import-paths` gained `aliasPrefixes`
  (default `['@/']`), and `filename-convention` gained `deprecatedSuffixes`
  (default `{ errorBoundary: 'error-boundary' }`).
