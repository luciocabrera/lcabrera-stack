---
'@lcabrera/repo-standards': minor
---

`repo-verify-commands` reads how this repository runs a task instead of assuming
one toolchain. It takes the spelling from `commands.run` in `devkit.config.json`
— the same key that answers the placeholder a materialised file carries — and
holds your command reference to that spelling, so a repository documenting
`npm run <task>` is no longer told that every task in the file is undocumented
with a remedy it has already carried out. The key also decides where the task
list comes from: a runner that runs manifest scripts and nothing else is read
from the manifests, while a toolchain that resolves a task from more than them is
asked for its list.

Nothing changes for a repository that has not set the key: it defaults to the
spelling this gate assumed before the key existed, and a failure now names the
spelling to write in.
