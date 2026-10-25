---
'@lcabrera/repo-standards': minor
---

`repo-verify-commands` now fails a `vp run` in a root `package.json` script or a workflow `run:` step that passes `--filter` (or `-F`) without `--fail-if-no-match`. Without that flag, a filter that matches no package warns and exits 0. The check reads only the options before the task name, because anything after it goes to the task. It runs only when `commands.run` names Vite+; other runners spell their filters differently. A repository with a bare filtered run will see this check fail after upgrading. Add the flag before the task name.

`repo-test-changed`, `repo-run-changed`, `repo-merge-coverage` and `repo-coverage-report` now pass `--fail-if-no-match` whenever they filter. Each filter names a workspace read from the workspace graph or from `devkit.config.json`, so a filter that matches nothing means the graph or the config has drifted. None of these commands relies on an empty match passing. When a diff touches no workspace, the change-scoped runners start no filtered run at all. `repo-merge-coverage` now exits 1 on a roster entry that matches no package. `repo-coverage-report` stays best-effort and warns about that entry.
