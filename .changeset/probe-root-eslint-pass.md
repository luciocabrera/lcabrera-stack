---
'@lcabrera/repo-standards': minor
---

`repo-verify-eslint-pass` can now probe a root eslint pass. Set `gates.eslintPass.rootPassDir` to a directory outside every workspace that the root package's `lint:eslint:check` lints. The gate then plants its misordered import there, runs `vp run -r lint:eslint:check` from the root, and fails unless that run reports the import. That catches a root `lint:eslint:check` script that has been removed or renamed, and a root config that no longer loads the rule. The key defaults to empty, which leaves the root pass unprobed as before.
