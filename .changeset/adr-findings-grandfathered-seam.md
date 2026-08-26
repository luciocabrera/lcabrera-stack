---
'@lcabrera/repo-standards': patch
---

`adrFindings` accepts the grandfathered-duplicate set as an option, defaulting to
the configured register.

Behaviour is unchanged for every caller: omit the option and it reads
`registers.adrGrandfatheredDuplicates` exactly as before.

The reason is coverage, not flexibility. The set is read from config and is empty
by default, so in a repository that declares no overlaps the `> 2` branch of the
duplicate check is unreachable from a test — deleting it left the whole suite
green. It is not dead code: the register exists so a consuming repository can
declare its own overlaps, which makes that branch live product behaviour. It is
now driven from a synthetic set, and both cases — a grandfathered number passing
twice, and failing on a third use — are asserted.
