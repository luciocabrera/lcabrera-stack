---
'@lcabrera/devkit': minor
---

`devkit closure --shipped` now reports a task that a shipped file runs but the shipped set never defines. The task is read after `npm run`, `pnpm run`, `yarn run`, `bun run`, `vp run`, `{{commands.run}}` or the configured `commands.run` value, in markdown inline code, a fenced shell block, a workflow `run:` step or a shell script's commands, and never in a comment. A task is defined when the profile wires it into the manifest, when a value in the configured `commands` block runs it, or when the shipped `COMMANDS.md` spells it as a run and the kit wires it at no rung. A task the kit wires only at a higher rung is reported below that rung. Any other task is printed as `runs the undefined task <name>`, and the command exits non-zero. Before this, the runner resolved and the task was never looked at, so an instruction to run a task the receiving repository does not have passed.

An invocation that passes the runner an option before the task, such as `--filter` or `-w`, names a workspace's task and is not checked. `devkit closure <dir>` does not check tasks, because the tasks a named directory may run are the ones its own repository defines.

`analyseClosure` from `@lcabrera/devkit/closure` takes two new optional arguments: `allowedTasks`, which turns the check on, and `runPrefixes`, the runner spellings to read. Without `allowedTasks` it reports what it did before.
