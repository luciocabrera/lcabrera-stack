---
'@lcabrera/devkit': minor
'create-lcabrera-stack': minor
---

`devkit create` with no `--profile` now places the `monorepo` rung instead of
`agent`. A flagless run leaves a workspace with an application, its configs and
its tasks, ready to install. The created `devkit.config.json` records
`"profile": "monorepo"`, so a later `sync` or `doctor` without the flag keeps to
that rung. `pnpm create lcabrera-stack` forwards to `devkit create` and gets the
same default. Pass `--profile agent` for the previous tree.

`devkit init` and `devkit sync` still default to `agent`.
