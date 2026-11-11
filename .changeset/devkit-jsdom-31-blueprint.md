---
'@lcabrera/devkit': minor
---

The `workspace` blueprint's catalog declares `jsdom` `^31.0.0`, so a repository devkit creates starts its DOM tests on jsdom 31 instead of 30.

`devkit create` copies the environment template exactly as before. Predicates internal to the closure and create commands are renamed, and `hasConfigKey` from `./config` returns the same result for every input.
