---
'@lcabrera/repo-standards': minor
---

`repo-test-changed` and `repo-run-changed` now fail when a `vp run` group they spawn is killed by a signal. Node reports that child's exit code as `null`, and the runner used to count it as exit 0, a pass.

`parseCommitHeader` from `./commit-convention` now declares its parameter as an optional `string` instead of `any`. Its runtime behaviour is unchanged: a missing header, and a `null` one, still return `null`. A TypeScript caller that passed some other type now gets a type error.
