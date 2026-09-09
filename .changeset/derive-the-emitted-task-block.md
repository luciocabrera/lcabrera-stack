---
'@lcabrera/devkit': minor
---

Reconcile the task block in a consumer's root manifest instead of writing it
once. Every run now merges it key by key against the record of what this kit last
wrote there: a task it wrote and you have not touched is updated in place, a task
you changed is reported and kept as you have it, a task it no longer ships is
removed, and one it has added since arrives — beside your own tasks, which it
never touches. A manifest holding no task this kit provably wrote is left alone
entirely, so a repository that never took the block does not acquire one. The
record lives in a new `tasks` block in `.devkit-manifest.json`.

The shipped `COMMANDS.md` now documents every task the kit wires, and
`commands:verify` is wired from the `monorepo` profile up so a consumer's own gate
holds the two together.

**Configure `commands.run`** — the prefix your repository runs a task by, such as
`npm run`. It is new, the shipped command reference carries a placeholder for it,
and a file whose placeholders cannot all be answered is not written: without the
key `COMMANDS.md` is reported as `unresolved` rather than materialised. `devkit
init --upgrade` adds it and keeps everything else you set.
