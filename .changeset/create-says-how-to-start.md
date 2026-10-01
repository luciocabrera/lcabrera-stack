---
'@lcabrera/devkit': patch
---

`devkit create` now ends with the commands that start the new repository: `cd`
into it, a plain install with the repository's package manager, and the `dev`
task when the profile wires one. The install is not `commands.install`, which
is the lockfile-bound CI form and fails in a repository that has no lockfile
yet. A directory name that is not a plain path is named rather than printed as
a `cd` command, because no single quoting is read literally by every shell. When
the runner is Vite+, the summary says `vp` is installed once per machine and
where to get it. It also says `devkit` is a dev dependency, not a global
command, and names the `devkit:check` and `devkit:sync` tasks that run it.

`devkit init --upgrade` no longer tells you to run `git config core.hooksPath`
when git already runs the hooks from that directory, however the path is
spelled (`./.githooks`, `.githooks/`, absolute). It still says so when the key
is unset or names another directory.
