# vite-react-compiler

A pnpm monorepo built with the [Vite+](https://viteplus.dev) unified toolchain
(`vp`). **The `packages/` are the product; the `apps/` exist to exercise them.**

## The packages

These publish to npm under **`@lcabrera/*`**. Each is meant to be consumed from
outside this repo, so each stands on its own — declared dependencies, a
resolvable public surface, no reliance on a consumer's tsconfig `paths`.
`vp run release:plan` prints the current publishable set.

| Package                                                  | What it is                                                                         |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [`@lcabrera/ui`](packages/ui)                            | React 19 + StyleX components — the Table, the Form, hooks, contexts, design tokens |
| [`@lcabrera/api`](packages/api)                          | the browser-safe data layer: fetch, query shapes, no `node:` anything              |
| [`@lcabrera/server`](packages/server)                    | the Node half — DB access, query builders, crypto, tokens                          |
| [`@lcabrera/utils`](packages/utils)                      | pure helpers; no DOM lib, no node types, no side effects                           |
| [`@lcabrera/node`](packages/node-runtime)                | process lifecycle — signals, shutdown                                              |
| [`@lcabrera/eslint-plugin`](packages/eslint-local-rules) | the custom lint rules                                                              |
| [`@lcabrera/tsconfig`](packages/tsconfig)                | the tsconfig factories and their writer                                            |
| [`@lcabrera/vite-config`](packages/vite-configs)         | the shared Vite/lint/test config                                                   |
| [`@lcabrera/devkit`](packages/devkit)                    | the repo setup this repo hands to another repo                                     |
| [`@lcabrera/repo-standards`](packages/repo-standards)    | the gates behind that setup — commits, ADRs, claims, publishing                    |

`ts-configs` stays `@repo/*` and never publishes — it is this repo's own
workspace roster.
The scope is the signal — `@lcabrera/` ships and has outside consumers,
`@repo/` is internal.

**Nothing but the version number stands between a mistake and the registry.**
`private` is off on each of them and each has a trusted publisher, so a merged
version bump publishes on its own, and an npm version is permanent. Read
[`packages/CLAUDE.md`](packages/CLAUDE.md) before editing any manifest there.

## The app

[`apps/react-router`](apps/react-router) is a React Router 7 SSR showcase — a
feature-rich data Table with store-based state, virtualization, infinite scroll
and granular `useSyncExternalStore` subscriptions. It is a harness, not a
product: it puts the packages under realistic load and is the only thing that
legitimately depends on several at once, which makes it where cross-package
integration gets verified. Never put a guarantee a _package_ relies on into it.

Products built on these packages live in their own repositories. If a change is
only meaningful to one of them, it belongs there — not here, and never inside a
package.

## Development

Everything goes through `vp` — never `pnpm`/`npm`/`yarn` directly, except for
the handful of commands `vp` does not wrap.

```bash
vp install            # install dependencies
vp run dev:showcase   # run the showcase app
vp run build:all      # build every workspace
vp run ready          # the full gate + build
```

Tests:

```bash
vp run test:ci        # what CI runs — showcase last, so its coverage is fresh
vp run test:all       # the same suites, in workspace dependency order
```

Before finishing any change, run the quality gate — `vp run check:safe` chains
it the way CI does. `vp check` alone is **not** the whole gate: it runs neither
the eslint pass nor `tsc`.

## Local database

The showcase serves its own tables and seeds itself.

```bash
vp run db:up                                # start local postgres
vp run db:status                            # check it
vp run --filter vite-react-compiler seed    # seed (a workspace script, hence --filter)
vp run --filter vite-react-compiler db:seed # or bring-up + seed together
vp run db:down                              # stop it
```

## Where to look next

- **[COMMANDS.md](COMMANDS.md)** — the canonical command reference: every root
  script, every per-workspace task, what CI runs. `vp run commands:verify`
  keeps it honest.
- **[AGENTS.md](AGENTS.md)** — project rules and conventions (symlinked as
  `CLAUDE.md` / `GEMINI.md` / `.github/copilot-instructions.md`).
- **[docs/README.md](docs/README.md)** — where each kind of doc lives, and how
  to read an ADR written when this repo was something else.
