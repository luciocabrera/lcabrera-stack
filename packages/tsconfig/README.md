# `@lcabrera/tsconfig`

Strict TypeScript config **factories** plus the generator that writes them to
disk — one `tsconfig.app.json` / `tsconfig.node.json` per workspace, from a
single typed source of truth.

It is deliberately not a set of `extends` bases. An `extends` chain still needs
a file per workspace, and each of those files is hand-maintained, so the
per-workspace differences drift. Here the differences are data: you write one
module listing your workspaces, and the generator writes the JSON.

## Install

```bash
npm install --save-dev @lcabrera/tsconfig
```

Needs Node 22.6+ if you run the generator with `node --experimental-strip-types`
(Node 24+ strips types with no flag). Any TypeScript runner works too.

## Generating configs in your repo

Create one module holding **your** workspace list — the package never sees it —
and one line that runs the writer over it.

`tools/tsconfig.entries.ts`:

```ts
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createAppTsConfig,
  createNodeTsConfig,
} from '@lcabrera/tsconfig/shared';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

export const entries = [
  {
    config: createAppTsConfig({
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
    }),
    filePath: path.resolve(repoRoot, 'apps/web/tsconfig.app.json'),
  },
  {
    config: createNodeTsConfig({
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.node.tsbuildinfo',
    }),
    filePath: path.resolve(repoRoot, 'apps/web/tsconfig.node.json'),
  },
  {
    // A library that must stay free of Node globals: no `process`, no `fs`.
    config: createNodeTsConfig({
      include: ['src'],
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
      types: [],
    }),
    filePath: path.resolve(repoRoot, 'packages/pure-utils/tsconfig.app.json'),
  },
] as const;
```

`tools/generate-tsconfigs.ts`:

```ts
import { writeTsConfigs } from '@lcabrera/tsconfig/generate';

import { entries } from './tsconfig.entries.ts';

await writeTsConfigs({ entries });
```

Wire it up in `package.json` and run it:

```json
{
  "scripts": {
    "tsconfig:generate": "node --experimental-strip-types ./tools/generate-tsconfigs.ts"
  }
}
```

```bash
npm run tsconfig:generate
```

Each workspace then keeps a thin, hand-written `tsconfig.json` holding only
project references:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

**The generated files are build artifacts.** A hand-edit to one survives exactly
until the next regeneration, which will not mention that it discarded it. Put
the change in your entries module instead.

**Run your formatter afterwards.** `renderTsConfig` emits plain
`JSON.stringify(config, undefined, 2)`, one array element per line; most
formatters collapse short arrays inline. Skip the format pass and every
regenerated file is dirty against its committed copy on pure whitespace.

## `@lcabrera/tsconfig/shared` — the factories

| Factory              | For                                    | What it sets                                                                         |
| -------------------- | -------------------------------------- | ------------------------------------------------------------------------------------ |
| `createAppTsConfig`  | browser / React workspaces             | `jsx: react-jsx`, `DOM` libs, `types: ['vite/client', …]`, a `@/*` → `./src/*` alias |
| `createNodeTsConfig` | Node services, tooling, Node-only libs | no JSX, no DOM lib, `types: ['node']` by default, no aliases                         |

Both apply the same strictness — `strict`, `noUncheckedIndexedAccess`,
`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`,
`verbatimModuleSyntax`, `erasableSyntaxOnly`. They are kept in lockstep on
purpose: while the node variant lacked `noUncheckedIndexedAccess`, an unchecked
`arr[0]` passed in Node-context packages and failed in browser ones, for no
principled reason.

Options worth knowing, because each one exists to prevent a specific failure:

- **`types: []`** on `createNodeTsConfig` — for a package contractually barred
  from Node globals. The config then cannot hand it the APIs it must not reach
  for, so purity is checked rather than reviewed.
- **`srcAlias: false`** on `createAppTsConfig` — drops the `@/*` alias. A
  publishable package should pass this: `@/` resolves only through a tsconfig,
  so an `@/` import cannot survive publication, and dropping the alias makes
  `tsc` reject one instead of a reviewer having to spot it.
- **`paths`** — extra aliases, merged over `@/*` when `srcAlias` is on and
  emitted alone when it is off. When both are off and `paths` is empty, the key
  is omitted from the output entirely rather than written as `{}`.

### `paths` accepts bare specifiers, and that is the point

`paths` is a plain `Record<string, readonly string[]>`, so a bare package name
maps as readily as a wildcard:

```ts
createAppTsConfig({
  paths: {
    // Deep imports stay unmapped on purpose — see below.
    '@acme/design-system': ['../../packages/design-system/src/public-api.ts'],
    '@acme/server/*': ['../../packages/server/src/*'],
  },
  tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
});
```

Mapping the **bare specifier only**, with no `/*` sibling, is a useful shape for
a source-shipping package: `tsc` then resolves every deep import through that
package's real `exports` map instead of short-circuiting it to `src/`. A subpath
missing from `exports` fails your typecheck rather than a consumer's install.
The factory does not enforce this — it has no idea which of your packages ship —
it just refuses to make the shape unexpressible.

## `@lcabrera/tsconfig/generate` — the writer

```ts
import { renderTsConfig, writeTsConfigs } from '@lcabrera/tsconfig/generate';
```

- **`renderTsConfig(config)`** → the exact bytes written for one config:
  two-space JSON with a trailing newline. Use it if your own build system owns
  the writing.
- **`writeTsConfigs({ entries, fileSystem? })`** → writes every entry,
  creating each missing parent directory first.

`fileSystem` defaults to `node:fs/promises`. Pass your own `{ mkdir, writeFile }`
to dry-run a generation, to route writes through a virtual filesystem, or to
assert what a run would produce without touching the disk:

```ts
const planned: Record<string, string> = {};

await writeTsConfigs({
  entries,
  fileSystem: {
    mkdir: async () => {},
    writeFile: async (filePath, contents) => {
      planned[filePath] = contents;
    },
  },
});
```

## License

MIT
