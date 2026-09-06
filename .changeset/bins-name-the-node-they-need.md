---
'@lcabrera/repo-standards': minor
'@lcabrera/devkit': minor
---

Both packages now declare `engines.node`. A bin is executed by your Node
straight out of `node_modules/.bin`, with none of this toolchain in front of it,
so the runtime it was written for is something your installer can act on instead
of something you find out from a syntax error on the first run. The floor is a
floor and not a band: no upper bound, so the next Node major will not refuse an
install nobody has looked at.

The size ceiling follows the file rather than the extension. `repo-verify-script-size`
measured `.mjs` and `.cjs` alone, which meant a tooling script left the ceiling
by being renamed and nothing reported it — a gate reading fewer files passes
exactly like a clean tree. It now also measures a `.js`, `.ts`, `.mts` or `.cts`
under a `scripts/` directory, which is the set the shipped script rule already
described. Expect a finding on a repository that keeps an oversized script there
under one of those extensions; nothing else changes about what it decides.

`files` in both packages excludes a colocated test by name rather than by
extension, so a test beside a script never reaches your install regardless of
what it is written in. `repo-standards` does the same for its fixture modules.
