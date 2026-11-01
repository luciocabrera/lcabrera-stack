---
'@lcabrera/devkit': patch
---

The workspace `pnpm-workspace.yaml` that devkit writes into a new tree overrides `minimatch@10` to `^11.0.1`, which clears GHSA-g3hv-75wg-m249. eslint, typescript-eslint and ts-morph all bring in minimatch 10, and no 10.x release carries the fix, so a new tree used to fail its own `deps:audit` on the day it was created. The override has to sit in the installing root's file, because pnpm ignores overrides declared by a dependency.
