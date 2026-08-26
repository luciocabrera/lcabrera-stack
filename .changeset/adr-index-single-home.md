---
'@lcabrera/repo-standards': patch
'@lcabrera/devkit': patch
---

The generated ADR index now says something true for the number of homes the
repository actually declares.

`adrHomes` defaults to **one**, and the index rendered a paragraph about "two of
them" and "no two homes" regardless — not false, but vacuous, and it reads as
though the reader has missed a second directory. The cross-home sentence is still
rendered when several homes are declared, because that is where the invariant it
states is load-bearing. A single-home index now carries the fact that is
load-bearing there instead — and its limit: `nextFreeNumber` takes the highest
number in use and adds one, so a gap is never filled and a retired number stays
retired, **unless** the retired ADR was the highest, in which case the next one
takes that number back. That exception is stated rather than glossed because the
index is generated into repositories whose readers will act on it without
re-deriving it (#974 is about closing the hole).

`renderIndex` gains an optional `homeCount` option defaulting to the configured
register, so every existing caller renders exactly as before.

`@lcabrera/devkit`'s seeded `docs/decisions/README.md` is regenerated to match,
so a freshly initialised repository's index does not fail its own `adr:verify` on
the first run.
