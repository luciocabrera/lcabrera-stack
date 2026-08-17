# @lcabrera/eslint-plugin

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
