---
'create-lcabrera-stack': minor
---

First release. `pnpm create lcabrera-stack <directory>` starts a repository on
this toolchain without having to know the toolchain's package name first.

It is a shim: it resolves `@lcabrera/devkit` and runs `devkit create` with the
arguments it was given. It exports nothing, parses no argument and holds no
default of its own, so every option and every refusal is that command's. Read
its changelog for what a run does; this package's records only the wrapper.
