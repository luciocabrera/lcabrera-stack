---
'@lcabrera/devkit': minor
---

Reconcile the whole task block in a consumer's root manifest instead of writing
it once. Every run now merges it key by key — the gate tasks and, from the
`monorepo` profile up, the blueprint's — against the record of what this kit last
wrote there: a task it wrote and you have not touched is updated in place, a task
you changed is reported and kept as you have it, a task it no longer ships is
removed, and one it has added since arrives, beside your own tasks, which it
never touches. Wiring a task where the manifest holds none is still only `init`'s
job for the gate tasks and `create`'s for the blueprint's, and a task whose
binary is not installed is still never written into a manifest that lacks it. The
record lives in a new `tasks` block in `.devkit-manifest.json`.

A task the run left alone counts as divergence, so `doctor --check` fails on a
block that has diverged. It reports what it counts either way; counting only the
tasks a run would write would have made a check that names your changed task and
then exits zero.

The shipped `COMMANDS.md` now documents every task the kit wires, and
`commands:verify` is wired from the `monorepo` profile up so a consumer's own gate
holds the two together.

**Configure `commands.run`** — the prefix your repository runs a task by, such as
`npm run`. It is new, the shipped command reference carries a placeholder for it,
and a file whose placeholders cannot all be answered is not written: without the
key `COMMANDS.md` is reported as `unresolved` rather than materialised. `devkit
init --upgrade` adds it and keeps everything else you set — and `sync` and
`doctor --check` now say so themselves, instead of sending you to the one command
that cannot write a config key.
