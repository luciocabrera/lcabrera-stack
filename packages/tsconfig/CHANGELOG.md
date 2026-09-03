# @lcabrera/tsconfig

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

## 0.2.0

### Minor Changes

- efaa4eb: The repo's TypeScript config factories and their generator are now a published
  package, `@lcabrera/tsconfig`. It carries the strictness baseline every workspace
  here is held to — `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`,
  `noUnusedParameters`, `verbatimModuleSyntax`, `erasableSyntaxOnly` — as two
  factories plus a writer, so a second repository can adopt the same baseline
  instead of copying a file and watching it drift.

  Not an `extends` base. An `extends` chain still needs a hand-maintained file per
  workspace, which is where per-workspace drift lives. Here your workspace list is
  data and the JSON is generated:

  ```ts
  import {
    createAppTsConfig,
    createNodeTsConfig,
  } from '@lcabrera/tsconfig/shared';
  import { writeTsConfigs } from '@lcabrera/tsconfig/generate';

  await writeTsConfigs({
    entries: [
      {
        config: createAppTsConfig({
          tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
        }),
        filePath: '/abs/path/apps/web/tsconfig.app.json',
      },
      {
        config: createNodeTsConfig({
          types: [],
          include: ['src'],
          tsBuildInfoFile,
        }),
        filePath: '/abs/path/packages/pure-utils/tsconfig.app.json',
      },
    ],
  });
  ```

  Two exports: `./shared` for `createAppTsConfig` / `createNodeTsConfig`, and
  `./generate` for `renderTsConfig` (the exact bytes one config is written as) and
  `writeTsConfigs`. `writeTsConfigs` takes an optional `fileSystem`, defaulting to
  `node:fs/promises`, so a generation can be dry-run or routed through a virtual
  filesystem without touching disk.

  Nothing in the package names a workspace, and every repo- or toolchain-specific
  default is an option a consumer can drop: `baseTypes: []` to shed `vite/client`
  outside a Vite project, `types: []` for a package that must stay free of Node
  globals, `srcAlias: false` for a publishable package that cannot ship an `@/`
  import, and `rootDirs` for a project with no `.react-router/types`. The `paths`
  map accepts a bare package specifier with no wildcard sibling, so `tsc` resolves
  deep imports through a source-shipping package's real `exports` map instead of
  short-circuiting them to `src/`.

  `renderTsConfig` and `writeTsConfigs` throw a `TypeError` for a config
  `JSON.stringify` cannot represent — `undefined`, a function and a symbol return
  `undefined` from it rather than throwing, which would otherwise reach disk as the
  literal text `undefined`. `writeTsConfigs` renders every entry before writing any
  of them, so such a failure names the offending `filePath` and leaves no
  half-generated tree.
