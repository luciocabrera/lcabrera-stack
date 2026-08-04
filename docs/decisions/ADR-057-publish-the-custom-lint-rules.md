# ADR-057 — The custom lint rules publish as `@lcabrera/eslint-plugin`

**Status:** Accepted · **Date:** 2026-08-04

## Context

`packages/eslint-local-rules` held the rules that enforce conventions no other
engine in the toolchain checks — filename case per type suffix, readonly `*Props`
members, one component per component file, `Args`/`Props` suffixes. They ran on
all 17 workspaces and were the only thing standing between those conventions and
prose in `AGENTS.md`.

It was named `eslint-local-rules-shared` — neither `@lcabrera/*` nor `@repo/*`.
[ADR-040](ADR-040-npm-scope-for-the-public-packages.md) says the scope answers
one question, _does it ship?_, so a package in neither scope means that question
was never asked. The doc-drift scout of the #515 health sweep found it as an
unscoped package and filed it as needing a decision rather than an edit.

The decision was the one the naming rule implies: the rules are useful outside
this repo, so they ship.

## Decision

**`packages/eslint-local-rules` publishes as `@lcabrera/eslint-plugin`**, the
fifth `@lcabrera/*` package, under the same publishing contract as the other four
(`packages/CLAUDE.md`).

### The rules had to become configurable first

Two of them hardcoded this repository's own conventions. `clean-import-paths`
treated `@/` as _the_ internal alias, so a consumer using `~/` or `#app/` got
silence rather than an answer; `filename-convention` carried this repo's
`errorBoundary → error-boundary` migration as a fixed map. Both are now options
with those values as defaults, so in-repo behaviour is unchanged and neither
forces our history on anyone (#541).

`filename-convention` needed no other change and, contrary to a first reading, was
already portable: an unrecognised suffix falls through and is skipped rather than
reported, so a consumer with suffixes we have never heard of gets no false
positives.

### The published name does not set the rule prefix

Naming a plugin `@lcabrera/eslint-plugin` conventionally makes ESLint resolve its
rules as `@lcabrera/<rule>`. That is not what happens here: the plugin is
registered under an explicit key in a flat config, so the key is whatever the
consumer writes. In this repo it stays `local-rules`.

Keeping it means every rule reference, every doc, and every
`eslint-suppressions.json` entry keyed by rule name is untouched — and inline
disable comments in consuming code keep working. The alternative bought nothing
but churn.

### `exports` points at `src`, like every other public package

An ESLint config is _loaded_, not just typechecked, so the plugin has to be
runnable. It is: `exports` resolves to `src/index.ts`, pnpm's workspace symlink
resolves to a real path outside `node_modules`, and Node strips the types.
`publishConfig.exports` swaps to `dist` at pack time because that same file
inside a consumer's `node_modules` is not loadable at all
(`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`) — the hazard
`scripts/verify-publish-surface.mjs` exists for.

### No `recommended` preset

Several of these rules encode a house style rather than a correctness property,
and a preset implies the set travels together. It does not: `clean-import-paths`
strips import extensions, which is actively wrong in a project compiling with tsc
under NodeNext, where they are required. This repo already disables it in the
non-React config for exactly that reason. Rules are opt-in individually.

## Consequences

**The undeclared cross-package edge is gone, and it had to be.**
`packages/vite-configs` imported the plugin by relative filesystem path
(`../eslint-local-rules/index.js`) — precisely what
[ADR-039](ADR-039-duplicate-over-undeclared-edges.md) exists to prevent, and
unreproducible for a consumer, who has no `../eslint-local-rules/`. It is now a
declared `workspace:*` dependency imported by name.

**Every workspace stopped building the plugin before linting.** The relative
import resolved to a hand-written `index.js` forwarding to compiled output, so
16 workspaces carried `vp run --filter … build &&` in their `lint` scripts and CI
had a preflight step for it. Loading from source deleted all of it.

**The dependency direction inverted, so the cycle moved.** vite-configs now
depends on the plugin, which means the plugin must not depend on vite-configs —
that cycle breaks every recursive `vp run -r` task graph. Its `eslint.config.mjs`
imports the shared config by relative path and its `vite.config.ts` inlines the
pack and coverage settings, exactly as `@lcabrera/utils` already does for the same
reason.

**The surface is now ratcheted.** `reports/api-surface/eslint-plugin.txt`
snapshots every rule's message IDs and option shapes, so changing either is a
visible breaking change rather than something a consumer discovers on upgrade.
`scripts/lib/api-surface-config.mjs` lists the watched packages explicitly rather
than deriving them from `publishConfig.access`, keeping publication a deliberate
two-part act: a manifest that says it ships, and an entry that puts it under the
ratchet.

**It also fixed the last hand-written tsconfig.** This package carried its own
`tsconfig.json`/`tsconfig.build.json` outside `@repo/ts-configs`, so it silently
missed every option the generated configs tightened — `erasableSyntaxOnly`,
`noUnusedParameters`, `verbatimModuleSyntax` among them. It now has a generated
`tsconfig.app.json` like every other workspace.
