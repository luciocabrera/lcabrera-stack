---
'@lcabrera/devkit': patch
---

`devkit create` now ends with the commands that start the new repository: `cd`
into it, the configured install command, and the `dev` task when the profile
wires one. It also says that `devkit` is a dev dependency, not a global command,
and names the `devkit:check` and `devkit:sync` tasks that run it.

`devkit init --upgrade` no longer tells you to run `git config core.hooksPath`
when git already runs the hooks from that directory. It still says so when the
key is unset or points somewhere else.
