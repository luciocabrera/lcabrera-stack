---
'@lcabrera/devkit': patch
---

`devkit create` now declares the toolchain the created tree calls. The root
manifest lists `@lcabrera/devkit` at every rung and `@lcabrera/repo-standards`
from the `repo` rung up, each as a floor with a bound below the next major. The
gate tasks for the rung are wired in the same run, because the manifest declares
their binaries. After one install, the hooks, the workflows and the gate tasks
find what they call, and `devkit init --upgrade` has nothing left to add.

Previously the manifest declared neither package. The hooks and workflows
failed on a missing binary, and the closing message sent you to
`devkit init --upgrade`, where no `devkit` binary was installed to answer it.
That message is gone.

`devkit init` in an existing repository is unchanged: it still wires a gate task
only when its binary is installed.
