# ADR-038: The shared packages are split by runtime — `@repo/api`, `@repo/server`, `@repo/utils`

**Status:** Accepted — supersedes the earlier decision that combined both runtimes in one `packages/data-access`

## Context

An earlier decision folded the browser fetch utilities and a new Postgres `db/`
subtree into one package, `packages/data-access`, and defended the mix explicitly: `packages/ui`
had already set the precedent of one package legitimately spanning two runtimes
(its `src/entry/` SSR utilities), so a second such package looked like consistency
rather than debt.

That reasoning was sound for what the repo was then. It stopped being sound, and
the failure was concrete rather than aesthetic.

`@repo/ui` needed exactly two fetch helpers from the package. Because those
helpers were shipped from the same workspace as the Postgres code, `@repo/ui`
declared `@repo/data-access` as a runtime dependency — and `@repo/data-access`
depends on `pg` and imports `node:crypto`. **Anyone installing `@repo/ui`, a
browser component library, pulled a Postgres driver into their dependency graph.**

The guard meant to catch this did not. `packages/ui`'s `check:public-api` walked
the import graph from `public-api.ts`, but only followed specifiers starting with
`.` — so it never crossed a package boundary and reported `PASS` throughout. A
guard that answers a narrower question than the one it appears to answer is worse
than no guard, because it is trusted.

Two further observations shaped the fix rather than just the diagnosis:

- **A package spanning two runtimes cannot have its runtime enforced.** Its
  tsconfig has to satisfy the union of both halves — DOM lib _and_ `node` types —
  so neither half is checked. A `process.env` read in browser code and a `window`
  read in server code both typecheck.
- **"Data access" never covered the whole package.** `crypto/` (scrypt hashing)
  and `tokens/` (bearer-token minting) are credential primitives containing no
  SQL, consumed by `apps/react-router/src/auth/` as well as by the
  server-side workspaces.

## Decision

**The shared packages split on runtime, and each package's name states its
runtime.**

| Package        | Runtime                         | Enforced by                            |
| -------------- | ------------------------------- | -------------------------------------- |
| `@repo/api`    | browser-safe                    | tsconfig omits `node` types            |
| `@repo/utils`  | pure, side-effect free, any     | tsconfig sets `types: []`              |
| `@repo/server` | Node-only (`pg`, `node:crypto`) | tsconfig is a node config — no DOM lib |
| `@repo/ui`     | browser (with an SSR subpath)   | `check:public-api`, both checks below  |

1. **The browser half of `data-access` was extracted to `packages/api`** — fetch,
   HTTP contracts, base-URL resolution — with `@repo/utils` as its only workspace
   dependency. `@repo/ui` now depends on `@repo/api` and no longer reaches the
   `pg` driver at all.

2. **The remainder was renamed `packages/server`.** `@repo/db` was considered and
   rejected: it would have misdescribed `crypto/` and `tokens/` exactly as
   `data-access` misdescribed them, only from the other side. Runtime is the
   property all four directories share.

3. **Each tsconfig now denies the runtime the package is not for**, so the
   boundary fails at typecheck instead of at review:
   - `@repo/api` gets no `node` types — a `process`/`fs` reach-in fails there.
   - `@repo/server` gets no DOM lib — a `window`/`document` reach-in fails there.

   This is why `@repo/server` is generated from `createNodeTsConfig` rather than
   `createAppTsConfig` with `types: ['node']` appended. The old form was a
   holdover from the two-runtime era and left the DOM lib granting `window`,
   `document` and `fetch` to server-only code.

4. **`check:public-api` gained a dependency-closure check.** For every `@repo/*`
   package in `packages/ui`'s runtime `dependencies`, it scans that package's
   whole source for `node:*` imports and fails if it finds any. The invariant:
   **a client-safe package may only depend on workspace packages that are
   themselves client-safe.** No denylist of "server" package names is needed —
   containing a `node:*` import is the signal, so a future package is covered
   without anyone remembering to list it.

5. **File naming is kebab-case across `@repo/api`, `@repo/server` and
   `@repo/utils`.** `@repo/ui` remains PascalCase, being a React component
   library. The `local-rules/filename-convention` rule is told the convention per
   workspace through its `suffixCase` option rather than switched off, so a
   camelCase `.util` in any of the three still fails the gate.

## Consequences

- **`@repo/ui` no longer transitively depends on `pg`.** This was the concrete
  defect; everything else here is what keeps it from recurring.
- **A four-package split costs more ceremony than one.** Each needs a tsconfig
  entry, an eslint config, a workspace label and a coverage entry. Accepted: the
  alternative is a package whose runtime cannot be enforced, which is what
  produced the defect.
- **Naming is now load-bearing rather than descriptive.** `api`/`server`/`utils`
  are claims the toolchain checks. A package that grows a second runtime does not
  get `types` widened to accommodate it — it gets split, or the offending code
  moves.
- **The superseded decision is recorded here, not kept as a husk.** Its Context
  above states what it decided and why the mix looked like consistency at the
  time; that reasoning is unchanged. The record it lived in was a bootstrap-era
  ADR describing a package layout that no longer exists, and it was deleted
  rather than maintained.

## Verification performed

`vp run typecheck:all` across all 17 workspaces, including `packages/ui`'s
`check:public-api`. The dependency-closure check was proved by making it fail:
re-adding `@repo/data-access` to `packages/ui`'s dependencies produced exit 1
listing three `node:crypto` imports, and the entry was then reverted. The
`.server` boundary lint rule was re-proved after its selector changed, by
importing `getPool` into a client file and confirming it still errors — a rule
that matches nothing reports the same clean pass as correct code. Full gate
(`vp check`, all three linters, `vp run test:ci`, `fallow audit --gate new-only`
with real coverage) clean on each of the changes this ADR describes.
