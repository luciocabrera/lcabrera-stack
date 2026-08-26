---
'@lcabrera/repo-standards': patch
---

The generated ADR index now says something true for the number of homes the
repository actually declares.

`adrHomes` defaults to **one**, and the index rendered a paragraph about "two of
them" and "no two homes" regardless — not false, but vacuous, and it reads as
though the reader has missed a second directory. The cross-home sentence is still
rendered when several homes are declared, because that is where the invariant it
states is load-bearing. A single-home index now carries the fact that is
load-bearing there instead: a retired number is never reissued, because
`nextFreeNumber` takes the highest in use and adds one rather than filling the
first gap.

`renderIndex` gains an optional `homeCount` option defaulting to the configured
register, so every existing caller renders exactly as before.
