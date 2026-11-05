---
'@lcabrera/repo-standards': minor
---

`repo-fallow-gate suppressions` accepts a `fallow-ignore` marker that a live entry of the repository's false-positive list confirms, and still fails every other marker in a changed file.

The marker's reason has to read `false positive, case FP-nnnn: <reason>`, and the list has to hold an entry for that case with `analyzer` `fallow`, the marker's kind as `rule`, the marker's file as `file`, and an `expires` that is a real `YYYY-MM-DD` calendar day not yet past. `never`, `2027-02-30` or a timestamp count as no expiry, so the marker fails. The list is a JSON array read from `registers.falsePositives` in `devkit.config.json`, which defaults to `docs/agents/false-positives.json`. With no list, every marker fails as before. The gate checks only the list. It does not read the evidence an entry points at, so the models that ruled, whether they agreed, and whether the flagged lines changed are a check the repository runs itself.
