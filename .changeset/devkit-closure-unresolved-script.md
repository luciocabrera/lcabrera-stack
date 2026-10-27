---
'@lcabrera/devkit': minor
---

`devkit closure` now reports a script that a shipped file runs but that exists nowhere. When `node`, `bash` or `sh` is told to run a path, in inline code, a fenced shell block or a workflow `run:` step, and that path is neither in the shipped set nor in the repository being checked, closure prints `runs nonexistent <path>` and exits non-zero. Before this, such a path was dropped without a finding, so a reference left behind by a moved or deleted script passed.

A path that is only named in prose is still not checked this way. Operands that hold `$`, `<`, `>`, `{`, `}` or `*` are treated as placeholders and skipped. A repository whose shipped files run a script that is not there will now fail `devkit closure`. To fix it, correct the reference or ship the script.
