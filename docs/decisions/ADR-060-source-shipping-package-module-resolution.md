# ADR-060 — A source-shipping package resolves its internals through `imports`, and exports a curated list

- **Status:** Accepted
- **Date:** 2026-08-12
- **Scope:** `@lcabrera/ui` (`package.json`, every file under `src/`), the tsconfig generator, the React ESLint restriction tables
- **Issue:** #565
- **Corrects:** the self-import convention in [`.claude/rules/typescript.md`](../../.claude/rules/typescript.md), which this decision found unworkable for a source-shipping package
- **Related:** ADR-038 (public package topology by runtime), ADR-046 (public API surface snapshot), ADR-039 (duplicate over undeclared edges)

## Context

`@lcabrera/ui` is the one public package that **ships source** rather than a
built `dist`: StyleX derives every custom-property name from
`packageName:pathRelativeToPackageRoot`, so a consumer's own plugin has to
compile our `.ts`/`.tsx` files (ADR-038, [`packages/CLAUDE.md`](../../packages/CLAUDE.md)).

Two consequences follow, and until now only the first was noticed.

The package's `exports` map carried eight wildcards — `./components/*`,
`./contexts/*`, `./hooks/*`, `./routing/*`, `./types/*`, `./utils/*`,
`./entry/*`, `./design-system/*` — so every file under those trees was
deep-importable the day it merged. The API-surface gate excludes wildcard
subpaths by design, since snapshotting everything they reach would drown the
real contract, so none of it was ratcheted. That is the leak #565 was filed
against.

The second consequence is the one that matters more. Because the package ships
source, a consumer compiles **our** files, and every self-referencing import
inside them — the convention was `@lcabrera/ui/components/Button` — resolves for
that consumer through this package's own `exports` map. In this repo those
imports never touch the map: `packages/ui` and both apps aliased
`@lcabrera/ui/*` to `src/*` in their tsconfigs, and Vite runs
`tsconfigPaths: true`. **Nothing here has ever exercised the published map.**

## Problem

A probe outside the repo — a bare tsconfig, no `paths`, `node_modules/@lcabrera/ui`
laid out as an install would — reports that importing the bare entry alone
yields **105 unresolved-module errors**, every one of them inside our own
shipped source.

The cause is that a wildcard target is not a file:

| Subpath                          | Target it maps to         | Resolves?                             |
| -------------------------------- | ------------------------- | ------------------------------------- |
| `.`                              | `./src/public-api.ts`     | yes — a real file                     |
| `./hooks`                        | `./src/hooks/index.ts`    | yes — a real file                     |
| `./components/Button`            | `./src/components/Button` | **no** — a directory                  |
| `./components/Table/Table.types` | `…/Table.types`           | **no** — the file is `Table.types.ts` |

`exports` resolution performs no extension search and no directory-index
lookup. TypeScript, Node's CJS resolver and Node's ESM resolver agree; the
ESM one returns a URL for a path that does not exist.

So the wildcards were not merely an over-wide surface. They did not work, and
the package could not be installed and used at all. The alias is what hid it:
in-repo everything resolved through `paths`, so every gate was green.

## Options considered

1. **Enumerate every public subpath, keep self-imports as `@lcabrera/ui/…`.**
   Rejected: 207 distinct subpaths are self-imported, so the "public" list would
   have to contain the whole internal tree to keep the package working — the
   opposite of curation.
2. **Rewrite self-imports as relative paths.** Works, but produces
   `'../../../../../../../utils/urlState'` at depth. `.claude/rules/typescript.md`
   uses exactly that shape as its counter-example.
3. **Give the wildcards concrete targets.** A single extensionless target
   satisfies Vite and fails `tsc`; a fallback array satisfies `tsc` and fails
   Vite. Neither shape works for both, and the surface stays wide either way.
4. **Node's `imports` field for internals, a curated `exports` for consumers.
   `Chosen.`**

## Decision

**Internals resolve through `#ui/*`.** `packages/ui/package.json` declares:

```jsonc
"imports": {
  "#ui/*": {
    "types": ["./src/*.ts", "./src/*.tsx", "./src/*/index.ts", "./src/*/index.tsx"],
    "default": "./src/*"
  }
}
```

The two conditions are not redundant. `tsc` reads `types` and needs a concrete
file, so it gets the fallback list; Vite and Rollup ignore `types`, take
`default`, and apply their own extension inference to the bare path. Probed
both ways — each condition alone fails the other tool.

Every import inside `packages/ui/src` uses this form. A `#` specifier is
**package-internal by specification**: no consumer can resolve `#ui/anything`,
so internals cannot leak into the public surface by accident. The boundary is
the resolver, not a lint rule.

**`exports` names every public subpath explicitly, with no wildcard**, each
mapping to a concrete file. The list is derived from what a consumer outside
the package actually imports.

**The `@lcabrera/ui/*` tsconfig alias is deleted** — from `packages/ui`'s own
config and from both consuming apps. This is the load-bearing half: without the
alias, `vp run typecheck` resolves every deep import against the real `exports`
map, so an unexported subpath fails here rather than on a consumer's machine.
No new gate was written; deleting the thing that hid the problem was enough.

## Consequences

**What this buys.** The package is installable. The public surface is
deliberate, and because every entry is now concrete, `api-surface:verify`
ratchets all of it — coverage went from 19 subpaths to 61 without changing the
gate. And the failure mode that produced this ADR is closed structurally: an
import that a consumer could not resolve now fails in-repo too.

**What this costs.** Every file in `packages/ui/src` uses a specifier shape
that appears nowhere else in the repo, and `#` is unfamiliar. The rule in
`.claude/rules/typescript.md` now differs per package — `@lcabrera/api`,
`server` and `utils` keep the package-name form, because they ship `dist` and
tsdown resolves their internals at build time. That split has to be stated
rather than inferred.

**The trap to know about.** `imports` and `exports` targets are exact paths.
Adding a public subpath means adding a concrete file target; a wildcard added
"for convenience" reintroduces the original bug in silence, because in-repo
nothing will notice.

**Not covered.** A consumer still needs the StyleX plugin: `virtual:stylex:runtime`
is unresolvable without it, and remains the single unresolved specifier in the
consumer probe. That is by design, not a defect.

## Alternatives considered

**Rejected on evidence: keeping the wildcards and ratcheting what they reach.**
The reason to prefer it would be avoiding churn. `packages/ui/src` holds 1507
non-test source files, so the snapshot would grow by three orders of magnitude
and regenerate on every internal file addition — and it would ratchet a surface
that does not resolve. The measurement is what settled it, not the aesthetics.

**Rejected: `@ui/*` instead of `#ui/*`.** Probed: Node's resolver maps
`#ui/utils/urlState` to a file path inside the package, and treats
`@ui/utils/urlState` as a bare package name it looks up in `node_modules` —
the `imports` field only accepts `#`-prefixed keys. TypeScript accepts both,
which is the trap: `@ui/*` would typecheck green and fail in the bundler,
reproducing exactly the class of bug this ADR exists to close.

## References

- Issue #565 — the wildcard export leak
- [ADR-038](./ADR-038-public-package-topology-by-runtime.md) — why `ui` ships source
- [ADR-046](./ADR-046-public-api-surface-snapshot.md) — the ratchet this widens
- [`packages/CLAUDE.md`](../../packages/CLAUDE.md) — the publishing contract
- [Node: package `imports`](https://nodejs.org/api/packages.html#imports)
