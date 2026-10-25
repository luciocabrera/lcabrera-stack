---
'@lcabrera/repo-standards': patch
---

`runGitStatus` from `scripts/git-exec.mjs` now returns `stderr` beside `status` and `stdout`: what git wrote to its error stream, trimmed, and an empty string when the command succeeded or git could not be found. A caller can now say why a git command failed instead of only that it did. Callers that read only `status` and `stdout` see no change.
