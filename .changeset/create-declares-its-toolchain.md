---
'@lcabrera/devkit': patch
---

`devkit create` now declares the toolchain the created tree calls. The root
manifest lists `@lcabrera/devkit` and `@lcabrera/repo-standards` at every rung,
each as a floor with a bound below the next major. Every gate task the rung owns
is wired in the same run, because the manifest declares its binary. After one install, the hooks, the workflows and the gate tasks
find what they call, and `devkit init --upgrade` has nothing left to add.

Previously the manifest declared neither package. The hooks and workflows
failed on a missing binary, and the closing message sent you to
`devkit init --upgrade`, where no `devkit` binary was installed to answer it.
That message is gone.

`devkit init` in an existing repository is unchanged: it still wires a gate task
only when its binary is installed.
