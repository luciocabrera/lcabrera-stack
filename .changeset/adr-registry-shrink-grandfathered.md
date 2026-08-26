---
'@lcabrera/repo-standards': minor
---

**Breaking:** the ADR duplicate-number check no longer exempts numbers 1–4 and 8.

`GRANDFATHERED_DUPLICATES` tolerated `001`–`005` and `008` appearing in two ADR
homes. That set was this repository's own historical overlap from when each home
ran its own sequence from 001, baked into the package as a module constant. Five
of those pairs no longer exist here, so the entries had stopped tolerating an old
collision and started licensing a new one — a number the gate permits twice is a
citation that can silently point at the wrong document. The set is now `{5}`.

**Who this breaks, and what to do.** A repository with two ADR homes that each
started at 001, so that `ADR-001`–`ADR-004` or `ADR-008` exist in both, passed
`vp run adr:verify` before and now fails it with "ADR-00N is used by 2
documents". There is no configuration for this yet — the set is still a module
constant, not a register — so until there is, either cite one side of each pair
by path and accept the failing gate, or pin `@lcabrera/repo-standards` to `0.2.x`.
Making the set configurable is tracked and is the intended fix.

Repositories with no such overlap are unaffected in practice, and get a stricter
gate: five numbers that were silently exempt are now checked like every other.
