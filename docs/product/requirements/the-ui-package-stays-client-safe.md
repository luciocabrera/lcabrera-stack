---
id: the-ui-package-stays-client-safe
lines:
  - application
persona: application-developer
state: met
packages:
  - ui
requires: []
issues: []
evidence:
  - type: code
    ref: packages/ui/scripts/check-public-api-client-safe.mjs
  - type: code
    ref: packages/ui/scripts/client-safety.mjs
  - type: test
    ref: packages/ui/scripts/client-safety.test.mjs
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
- **The guard fails when it scanned nothing.** A dependency set that selects no
  package, a package the workspace roster cannot place, and a package placed in a
  directory with no source under it are each reported as a defect in the check,
  because none of them can be told apart from a clean run by its output.
- The published entry map resolves from an install without a server-only entry
  reaching the client one: `vp run publish:verify`.

## Notes

The second criterion is the one that carries this, and until #1010 nothing
checked it. `collectWorkspaceDependencyNames` selected dependencies whose name
started with `@repo/`; this package's runtime dependencies are `@lcabrera/api`
and `@lcabrera/utils`, so the list was empty and the closure half opened no file
while printing that the workspace dependencies were client-safe. The filter was
correct when it was written, and stopped matching anything at the npm scope
rename ([ADR-040](../../decisions/ADR-040-npm-scope-for-the-public-packages.md)).
No one edited the guard, and no test failed — which is how a live gate goes
quiet.

What holds the criterion now is that the selection and the name-to-directory
mapping both come from the workspace roster
([`deriveWorkspaces`](../../../packages/repo-standards/scripts/workspace-scopes.mjs)),
so a rename moves them together, and that the guard treats an empty scan as a
defect rather than as a pass. Both probes behind the `met` state are in #1010's
pull request: `node:fs` planted in `packages/utils/src` fails
`vp run typecheck:all` and names the file, and the same import planted in
`packages/ui/src/public-api.ts` fails the graph half.

Do not read this as "the type system covers it as well". It does not.
`packages/utils/tsconfig.app.json` sets `types: []`, but its `include` pulls
`vite.config.ts` into the same program, which brings `@types/node`'s ambient
module declarations with it, so `tsc` accepts a `node:*` import in that package's
source. The guard is the only thing that rejects one. Narrowing that `include`
would put a second line of defence behind it, and #1010 deliberately left it
alone: the tsconfigs are generated from one factory, so the change lands in every
workspace at once and needs its own probe.
