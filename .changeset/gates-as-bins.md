---
'@lcabrera/repo-standards': minor
---

The tree-reading gates are bins now, alongside the commit, branch, pull request
and register gates that were already here. `repo-verify-commands`,
`repo-verify-deps-audit`, `repo-verify-departed-names`,
`repo-verify-renamed-mentions`, `repo-verify-doc-registers`,
`repo-verify-script-exits`, `repo-verify-eslint-pass`,
`repo-verify-viteplus-block`, `repo-verify-inventory`,
`repo-verify-lint-plugins`, `repo-verify-package-refs`,
`repo-verify-react-doctor`, `repo-verify-route-artifacts`,
`repo-verify-harness` and `repo-verify-review-threads` fail a build; the
change-scoped runners `repo-test-changed` and `repo-run-changed`, the coverage
pair `repo-merge-coverage` and `repo-coverage-report`, and the reports and
tools `repo-lint-report`, `repo-usage-report`, `repo-product-distance`,
`repo-docs-for-package`, `repo-pr-threads`, `repo-housekeeping-prune` and
`repo-worktree-env` do the rest. Each finds the repository by walking up from
its own location, the way the existing bins do, so it runs from an install as
well as from a checkout.

The repository facts these gates read are keys in `devkit.config.json` rather
than constants: `registers.requirementsDir` and `registers.planningDir`, and
under `gates` the blocks `commandsDoc`, `depsAudit`, `departedNames`,
`inventory`, `coverage`, `eslintPass`, `affectedTests`, `lintReport`,
`reactDoctor`, `usageReport` and `vitePlusBlock`. Every file-path key
defaults to the conventional location and is validated as repo-relative. The
workspace rosters (`coverage.mergeWorkspaces`, `coverage.reportWorkspaces`,
`eslintPass.probeWorkspaces`, `inventory.trees`) default to nothing, and a gate
handed an empty roster refuses to pass rather than passing over no workspaces.
`affectedTests.globalPackages` joins them: it names the shared config packages
whose change must force the full run, and an empty one is refused because a
scoped run in their place leaves the dependents untested while still reporting a
plausible subset. Its two neighbours are accepted empty on purpose —
`affectedTests.lintOnlyPatterns` (regular-expression sources for the paths the
linters already gate, whose absence only over-selects) and
`affectedTests.coverageTaskPackage` (one workspace, whose absence means no task
substitution).

Two of the bins read their input rather than resolving it: under `--changed`,
`repo-merge-coverage` and `repo-coverage-report` take the changed-file list on
stdin, so a repository wiring either into a task feeds that list itself and gets
a full run when it does not.

The modules a repository's own scripts may need beside the bins are exported:
`affected-tests`, `gh-exec`, `jsonc`, `merge-queue`, `public-package-dirs`,
`review-gate-reconcile`, `review-gate-status`, `review-threads`,
`route-artifacts`, and the `conformance-*` readers behind the harness gate.
