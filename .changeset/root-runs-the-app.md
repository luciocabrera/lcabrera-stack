---
'@lcabrera/devkit': minor
---

The `monorepo` rung's root manifest now has `dev`, `build` and `start` tasks. Each one hands off to the application workspace's task of the same name, so `vp run dev`, `vp run build` and `vp run start` work from the repository root. The shipped `COMMANDS.md` documents all three, which keeps `commands:verify` green. A repository already on the rung picks them up on its next sync, next to its own tasks. A root task of the same name that the repository already declares is reported and left alone.
