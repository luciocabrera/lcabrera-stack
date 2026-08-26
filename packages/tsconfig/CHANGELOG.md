# @lcabrera/tsconfig

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
