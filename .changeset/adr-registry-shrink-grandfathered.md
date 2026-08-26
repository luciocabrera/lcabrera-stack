---
'@lcabrera/repo-standards': patch
---

Shrink the grandfathered ADR-number set to the one pair that still overlaps.

`GRANDFATHERED_DUPLICATES` tolerated numbers 1–5 and 8 appearing in two ADR homes,
which was the genuine overlap when each home ran its own sequence from 001. Five
of those pairs no longer exist, so the entries were licensing collisions rather
than tolerating them — a number the gate permits twice is a citation that can
silently point at the wrong document. Only `005` is still a real pair.

Consumers that had no overlap of their own were getting six numbers exempted from
the duplicate check for no reason; they now get one, and any other repeat is
rejected. A consumer with its own overlap should note that this set is still a
module constant rather than configuration.
