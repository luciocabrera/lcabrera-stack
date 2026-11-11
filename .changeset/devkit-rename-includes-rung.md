---
'@lcabrera/devkit': minor
---

`includesRung` from `./config` is now `doesProfileIncludeRung`. It takes the same `{ profile, rung }` argument and returns the same boolean: `true` when `profile` is `rung` or a rung above it, and `false` for a name off the ladder on either side.

**This is the breaking part:** `includesRung` is removed, with no alias. An import of it from `@lcabrera/devkit/config` fails until it names `doesProfileIncludeRung` instead.
