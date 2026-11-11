---
'@lcabrera/repo-standards': minor
---

`repo-fallow-gate mutation` passes `--typecheck` to `fallow mutation`. A surviving mutant whose program does not type-check is classed `compile_error` and leaves the score, because no test can kill a program the type checker already rejects. A surviving mutant that does type-check still fails the gate at `--min-score 100`.

The gate takes longer where mutants survive, since fallow type-checks each survivor.
