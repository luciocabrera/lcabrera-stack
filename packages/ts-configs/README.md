# `@repo/ts-configs`

This repo's **tsconfig entry table**, plus the one line that hands it to the
published generator. Every workspace's `tsconfig.app.json` / `tsconfig.node.json`
is written from here.

The factories and the writer are **not** here. They live in
[`@lcabrera/tsconfig`](../tsconfig/README.md), which publishes to npm; this
workspace is what stayed behind when that package was split out
([ADR-069](../../docs/decisions/ADR-069-publish-the-shared-toolchain.md)), and it
stayed behind for one reason: `tsconfig.entries.ts` is nothing but this repo's
own workspace roster, and a consumer installing the package must not receive it.

So the two names mean different things, and it matters which one you are editing:

|                 | `@lcabrera/tsconfig`          | `@repo/ts-configs` (here)                     |
| --------------- | ----------------------------- | --------------------------------------------- |
| What it is      | the published package         | the private workspace that survives the split |
| Holds           | both factories and the writer | `tsconfig.entries.ts` plus a one-line runner  |
| `private`       | `false`                       | `true`                                        |
| Who consumes it | this repo, and any other repo | nothing — it is a task host, not a library    |

## How it works

```
packages/tsconfig/src/tsconfig.shared.ts  ← edit to change any compiler option
        │                                   (published as @lcabrera/tsconfig/shared)
tsconfig.entries.ts                       ← edit to add or retune one workspace
        │
        ▼  vp run --filter @repo/ts-configs generate
        │
        ├── packages/ts-configs/tsconfig.app.json  ← this workspace's own (Node)
        ├── apps/react-router/tsconfig.app.json    ← generated
        ├── apps/react-router/tsconfig.node.json   ← generated
        ├── apps/admin_system/tsconfig.app.json    ← generated
        └── … one per workspace
```

Each workspace keeps a thin hand-written `tsconfig.json` that only holds project
references:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

The `tsconfig.app.json` and `tsconfig.node.json` files are **build artifacts** —
don't edit them by hand.

## Running the generator

```bash
# From the repo root
vp run --filter @repo/ts-configs generate
```

Run it whenever you change `tsconfig.entries.ts`, or the factories in
`@lcabrera/tsconfig`.

**Always follow it with `vp fmt .` from the repo root.** The generator writes
plain `JSON.stringify` output (one array element per line); Oxfmt collapses short
arrays inline. Skipping the format pass leaves every regenerated file dirty
against the tracked copy and fails the gate's format stage — the diff looks like
a real change but is pure whitespace.

## Adding a new workspace

Open `tsconfig.entries.ts` and add an entry to the `configs` array — one per
config file the workspace needs:

```ts
{
  config: createAppTsConfig({
    tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
  }),
  filePath: path.resolve(workspaceRoot, 'apps/my-new-app/tsconfig.app.json'),
},
{
  config: createNodeTsConfig({
    tsBuildInfoFile: './node_modules/.tmp/tsconfig.node.tsbuildinfo',
  }),
  filePath: path.resolve(workspaceRoot, 'apps/my-new-app/tsconfig.node.json'),
},
```

Then re-run the generator. A workspace with no entry silently falls back to the
near-empty root `tsconfig.json` and is checked far more loosely than every other
one, so this step is not optional (AGENTS.md §4).

The factories' full option set — `include`, `exclude`, `rootDirs`, `paths`,
`srcAlias`, `types` — is documented in
[`@lcabrera/tsconfig`'s README](../tsconfig/README.md).

## Files

| File                       | Purpose                                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| `tsconfig.entries.ts`      | The per-workspace entries, as data — what each one overrides, and why                     |
| `generate.ts`              | The runner: hands `configs` to `writeTsConfigs` from `@lcabrera/tsconfig/generate`        |
| `tsconfig.entries.test.ts` | Asserts the invariants that live in the entry table, not in the factories                 |
| `tsconfig.app.json`        | Generated — this workspace's own config, and a **Node** one: its source runs under `node` |

The entries live apart from the runner so the whole set can be asserted without
running the generator — importing `generate.ts` rewrites every config in the repo
as a side effect, which no test can do. That is what lets
`tsconfig.entries.test.ts` gate the invariant
[ADR-060](../../docs/decisions/ADR-060-source-shipping-package-module-resolution.md)
rests on: `packages/ui` gets **no** path aliases, so `vp run typecheck` resolves
its deep imports against the real `exports` map rather than short-circuiting it.
