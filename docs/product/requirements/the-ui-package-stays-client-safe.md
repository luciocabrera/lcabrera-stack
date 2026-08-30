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
  - type: test
    ref: packages/ui/scripts/client-safety-report.test.mjs
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
- No workspace package in the runtime dependency **closure** of `@lcabrera/ui`
  contains a `node:*` import — the packages it declares, the packages those
  declare, and so on to any depth. A client-safe package may depend only on
  packages that are themselves client-safe, and an install pulls the whole
  closure, so the property does not stop at the first edge.
- What is read is what a dependency publishes. A file its `files` field excludes
  — a colocated test, a benchmark — reaches no consumer's install, so a `node:*`
  import there is outside this requirement rather than a violation of it.
- The guard is wired into the package's own `typecheck` task, so it runs in CI
  through `vp run typecheck:all` rather than as a step somebody has to remember.
- **The guard fails when the invariant is broken.** A `node:*` import planted in
  a package the closure reaches — one this package declares, or one only a
  dependency of it declares — makes the gate fail. A check that reports the same
  pass whether or not the property holds settles nothing, so this criterion, not
  the ones above it, is what makes them checkable rather than merely true today.
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

What holds the criteria now: selection and the name-to-directory mapping both
come from the workspace roster
([`deriveWorkspaces`](../../../packages/repo-standards/scripts/workspace-scopes.mjs)),
so a rename moves them together; the walk follows every edge in the closure
rather than only the ones `packages/ui` declares itself; the source read for each
package is the source that package publishes; and a scan that opened nothing is a
defect rather than a pass.

The transitive walk is not decoration. `@lcabrera/api`'s only workspace
dependency is `@lcabrera/utils`, which `packages/ui` declares directly too, so a
one-edge walk covers today's closure by coincidence — and the coincidence ends
the moment `api` gains a dependency of its own.

Three probes stand behind the `met` state, each run in #1010's pull request,
which is where their output is dated:

1. **Two edges out.** Add `"@lcabrera/node": "workspace:*"` to
   `packages/api`'s `dependencies` and a `node:fs` import to
   `packages/node-runtime/src`, then run
   `vp run --filter @lcabrera/ui check:public-api`. It exits 1 naming the file
   and the edge it arrived through. The precondition that makes this
   discriminate: `packages/ui` does not declare `@lcabrera/node`, so a walk of
   only its own `dependencies` never opens that package and prints PASS — which
   is exactly what the guard did before this walk went transitive.
2. **One edge out, through the task CI runs.** Plant `node:fs` in
   `packages/utils/src/objects/merge-objects.util.ts` **and use it** — export a
   function that calls `readFileSync`. `vp run typecheck:all` then exits 1 on
   `packages/ui`'s `check:public-api` step, naming the file. The import must be
   used: `noUnusedLocals` is on, so a bare
   `import { readFileSync } from 'node:fs';` fails `packages/utils`'s own `tsc`
   with `error TS6133` first, `vp run -r` stops before `packages/ui`, and no
   `check:public-api` line reaches the log at all. That run exits 1 on a tree
   where the guard is dead exactly as it does on one where it works, so it is
   not evidence of anything this requirement claims.
3. **The graph half.** The same import in `packages/ui/src/public-api.ts` fails
   `vp run --filter @lcabrera/ui check:public-api`.

A colocated test is deliberately not a violation. `packages/utils` and
`packages/api` both carry `!src/**/*.test.*` in `files`, so a test that reads a
fixture with `node:fs` ships to nobody; scanning it would fail this package's
gate over a file no consumer receives.

Do not read this as "the type system covers it as well". It does not.
`packages/utils/tsconfig.app.json` sets `types: []`, but its `include` pulls
`vite.config.ts` into the same program, which brings `@types/node`'s ambient
module declarations with it, so `tsc` accepts a `node:*` import in that package's
source. The guard is the only thing that rejects one. Narrowing that `include`
would put a second line of defence behind it, and #1010 deliberately left it
alone: the tsconfigs are generated from one factory, so the change lands in every
workspace at once and needs its own probe.
