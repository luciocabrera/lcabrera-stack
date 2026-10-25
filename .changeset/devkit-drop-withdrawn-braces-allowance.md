---
'@lcabrera/devkit': patch
---

The `docs/agents/dependency-advisories.json` that `devkit init` and `devkit create` place at the `monorepo` rung now starts with no allowances. Its one entry covered GHSA-vfj7-8cjw-p6xm in `braces`, and that advisory has been withdrawn, so the entry matched nothing and a created tree's `deps:audit` failed on it as a stale allowance. The register and the gate that reads it are unchanged.
