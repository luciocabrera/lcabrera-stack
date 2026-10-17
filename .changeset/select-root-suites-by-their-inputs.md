---
'@lcabrera/repo-standards': minor
---

`repo-test-changed` now selects every root test suite from configuration. `gates.affectedTests.rootSuites` lists each test task that lives in no workspace, with the path patterns whose change can fail it, and a changed file matching one adds that task as its own group. A suite that reads root config can now be selected by a change to that config alone. Left unset, the only root suite is `test:scripts` over the `.mjs`, `.cjs` and `.js` files under `scripts/`, which is the previous behaviour.

Breaking, for code importing `@lcabrera/repo-standards/affected-tests`: `resolveAffected` and `resolveTestGroups` take a `rootSuites` argument and return `suites`, the selected task names, in place of the `scripts` flag; `renderSelectionMarkdown` takes `suites` in place of `scripts`; and `SCRIPTS_TEST_TASK` is removed. Pass `rootSuites` from `readGates(root).affectedTests` and read `suites` where you read `scripts`.
