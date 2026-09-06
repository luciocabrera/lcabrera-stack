---
'@lcabrera/devkit': minor
---

`devkit create <directory> [--profile <name>]` makes a repository that does not
exist yet. It creates the directory, runs `git init` on the trunk branch the
shipped gates expect, writes a minimal manifest, materialises the selected
profile through the same plan `sync` and `doctor` read, and leaves an initial
commit.

`init` is unchanged, including both of its refusals. `create` mirrors them from
the other side: it refuses a target that is not empty, a target nested inside an
existing git repository, and a profile that is not on the ladder — each naming
what to run instead.

No gate task is wired by a `create` run, because nothing is installed in a
repository made a second ago. Install, then run `devkit init --upgrade` there to
add the tasks whose binaries have arrived.
