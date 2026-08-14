---
'@lcabrera/tsconfig': minor
---

The repo's TypeScript config factories and their generator are now a published
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

Nothing in the package names a workspace, and every option carries a neutral
default — `types: []` for a package that must stay free of Node globals,
`srcAlias: false` for a publishable package that cannot ship an `@/` import, and
a `paths` map that accepts a bare package specifier with no wildcard sibling, so
`tsc` resolves deep imports through a source-shipping package's real `exports`
map instead of short-circuiting them to `src/`.
