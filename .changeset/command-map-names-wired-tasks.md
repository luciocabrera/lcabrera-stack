---
'@lcabrera/devkit': patch
---

Every command in the `commands` map of a tree `devkit create` makes at the
`monorepo` profile now runs in that tree. Under Vite+, `test` and `audit` stand
for tasks: `test` runs `vp run test:all` and `audit` runs `vp run deps:audit`
wherever the manifest holds that task after the run. Where it does not, `test`
stays `vp run test` and `audit` is `vp pm audit --level moderate`, which
any Vite+ repository can run.

`deps:audit` is a new gate task at the `monorepo` profile:
`vp pm audit --json | repo-verify-deps-audit`. It is wired only where the
blueprint is, like `commands:verify`, and only where `repo-verify-deps-audit` is
installed or declared. It fails on an advisory at `moderate` or above, and on a
report that walked no dependencies, so an unreachable registry fails it.

Previously the map named `vp run test` and `vp run deps:audit`, and a created
tree defined neither task, so the check workflow, the dependency-audit workflow
and the pre-push hook all failed.

A tree created by an earlier version keeps the commands it has. `devkit init
--upgrade` wires `deps:audit`, which makes its `audit` command run, and prints
`test: kept "vp run test" (would infer "vp run test:all")` so you can correct
`test` by hand.
