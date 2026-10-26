---
'@lcabrera/devkit': minor
---

`devkit closure` now reads shell scripts. A file in the `paths.hooks` directory, or any file whose first line is an `sh`, `bash`, `dash` or `zsh` shebang, has its commands, paths and run scripts resolved the way a workflow `run:` step's are. A hook that runs `node scripts/<file>.mjs` now fails closure when that script is outside the shipped set (`needs`) or exists nowhere (`runs nonexistent`). Comments in the script are not read.

Closure also names the files it did not read. Under each `--shipped` profile, and under each directory in the directory form, a file that no resolver reads is listed as `unchecked  <path>  no resolver reads it`. Markdown, JavaScript and TypeScript source, workflows, shell scripts and subagent definitions are read; a JSON or JSONC config, a stylesheet, SQL, an env template or a non-workflow YAML file is not. The `--shipped` header now reads `<n> shipped file(s), <r> read, <u> unchecked` instead of `self-contained`. An unchecked file is not a finding and does not change the exit code.

A YAML file is now treated as a workflow only when it has a top-level `jobs:` key. Any other YAML file, such as a compose file or a workspace manifest, is no longer read as one and is listed as unchecked.
