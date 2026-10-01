---
'@lcabrera/devkit': minor
---

`devkit create` with no `--profile` places the `full` rung, and finishes the setup itself after its commit. At `full` it writes `docker/local/.env` from the template beside it, naming the compose project after the repository. It installs with `vp install`, or with the package manager that ran it when `vp` is not on PATH. When Docker is running it then runs `db:up`, waits until Postgres answers, and runs `db:seed`. The summary prints only the steps left, which after a full run are `cd <directory>` and the `dev` task.

A step the machine cannot take (no `vp` or package manager, no `docker`, Docker not running) is printed as a command to run later, and the run exits 0. A step that ran and failed exits 1 and says the repository is in place. `--no-install` skips the install and the database; `--no-db` skips the database.

The `full` rung's application now ships its own `vite.config.ts`, which loads the compose environment file for the development server and sources it for `start`. Before this, both answered 500 in a created tree because nothing put the database settings into the server's environment.

**Action needed:** pass `--profile monorepo` to keep the previous default, and `--no-install` where a pipeline installs the tree itself.
