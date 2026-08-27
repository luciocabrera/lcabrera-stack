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
- The check is wired into the package's own `typecheck` task, so it runs in CI
  through `vp run typecheck:all` rather than as a step somebody has to remember.
- The published entry map resolves from an install without a server-only entry
  reaching the client one: `vp run publish:verify`.

## Notes

The second criterion is the one that carries this, and it is the one that did
not exist: an earlier version of the check followed only relative paths, so it
never crossed a package boundary and reported a pass while the package depended
on one importing `node:crypto`. A guard answering a narrower question than it
appears to answer is worse than none, because it is trusted — which is why the
criterion is stated as the closure, not as "the script passes".
