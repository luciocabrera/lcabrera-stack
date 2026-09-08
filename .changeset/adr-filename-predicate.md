---
'@lcabrera/repo-standards': minor
---

`looksLikeAdr` is now `isAdrFilename`, on the `./adr-registry` subpath. It
returns a boolean and now says so, which is what the repository asks of every
other predicate. Update the import; nothing about the behaviour changed.
