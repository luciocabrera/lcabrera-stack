---
'create-lcabrera-stack': minor
---

`pnpm create lcabrera-stack <directory>` now creates the `full` rung and installs it, then starts and seeds its local database when Docker is running, because it runs `devkit create` with the arguments it was given. `--no-install` and `--no-db` reach `devkit create` unchanged. The README shows the one command that lifts pnpm's minimum release age for both the create and the install it now runs.
