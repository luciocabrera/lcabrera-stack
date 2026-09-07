---
'create-lcabrera-stack': minor
---

The initializer declares `engines.node`. It ships a bin, and a bin is handed to
your Node straight out of `node_modules/.bin` with none of this toolchain in
front of it, so the runtime it was written for is something your installer can
act on instead of something you find out from a syntax error on the first run.
The floor is a floor and not a band: no upper bound, so the next Node major will
not refuse an install nobody has looked at.

`files` excludes a colocated test by name rather than by extension, so a test
beside the shim never reaches your install regardless of what it is written in.
