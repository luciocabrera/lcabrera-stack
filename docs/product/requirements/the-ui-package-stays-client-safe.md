---
id: the-ui-package-stays-client-safe
lines:
  - application
persona: application-developer
state: unmet
packages:
  - ui
requires: []
issues:
  - 1010
evidence:
  - type: code
    ref: packages/ui/scripts/check-public-api-client-safe.mjs
  - type: code
    ref: packages/ui/package.json
  - type: command
    ref: vp run typecheck:all
  - type: command
    ref: vp run publish:verify
  - type: doc
    ref: docs/decisions/ADR-038-public-package-topology-by-runtime.md
---

# Nothing server-only rides in with the component package

## Statement

I bundle the component package for the browser. I want to know that nothing
server-only comes with it — not from the package itself, and not from something
it depends on two edges away. This is the failure I find out about last: my
bundle breaks in a build I did not change, or my dependency graph quietly grows
a database driver, and neither points back at the import that caused it.

## Acceptance

- No `node:*` specifier is reachable from `packages/ui/src/public-api.ts`
  through its import graph.
- No workspace package in the runtime dependencies of `@lcabrera/ui` contains a
  `node:*` import — a client-safe package may depend only on packages that are
  themselves client-safe.
- The guard is wired into the package's own `typecheck` task, so it runs in CI
  through `vp run typecheck:all` rather than as a step somebody has to remember.
- **The guard fails when the invariant is broken.** A `node:*` import planted in
  the source of a declared workspace dependency makes the gate fail. A check that
  reports the same pass whether or not the property holds settles nothing, so
  this criterion — not the two above it — is what makes them checkable rather
  than merely true today.
- The published entry map resolves from an install without a server-only entry
  reaching the client one: `vp run publish:verify`.

## Notes

The second criterion is the one that carries this, and it is the one nothing
checks today — which is why this is `unmet` while the condition it states
happens to be true.

`collectWorkspaceDependencyNames` in
[`packages/ui/scripts/check-public-api-client-safe.mjs`](../../../packages/ui/scripts/check-public-api-client-safe.mjs)
selects dependencies whose name starts with `@repo/`. This package's runtime
dependencies are `@lcabrera/api` and `@lcabrera/utils`, so the list is empty and
the closure half **scans no packages at all**. Its `PASS` line still says "and
its workspace dependencies are client-safe". #1010 tracks the fix; the register
is the wrong place to repair a script.

Do not read the gap as "the type system covers it instead". Planting
`import { readFileSync } from 'node:fs'` in `packages/utils/src` and running the
whole of `vp run check:safe` exits 0: the guard passes, and so does `tsc`,
because `packages/utils/tsconfig.app.json` sets `types: []` but its `include`
pulls `vite.config.ts` into the program, which brings `@types/node`'s ambient
module declarations with it. Nothing holds this invariant right now. It is true
because nobody has written that import, and that is all.

The half that does work is the first criterion: the same import planted in
`packages/ui/src/public-api.ts` fails the guard with a named file and a non-zero
exit. Both probes are in this pull request's thread, and both revert cleanly.

The history is worth one line, because it is how a live guard goes quiet without
anyone touching it: the filter was correct when the dependencies were named
`@repo/*`, and it stopped matching anything when they were renamed to
`@lcabrera/*` for the npm scope split
([ADR-040](../../decisions/ADR-040-npm-scope-for-the-public-packages.md)). No
one edited the guard, and no test failed.
