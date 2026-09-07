---
'@lcabrera/repo-standards': patch
---

`repo-coverage-report` no longer fails on a workspace whose suite covers no file
of its own. Istanbul's json-summary writes `"pct": "Unknown"` — a string — for a
total with nothing in it, and the report formatted every percentage with
`toFixed`, so one such workspace ended the run after every other had already
been measured.

A metric is normalised as it is read now, and an empty total reads as complete —
which is the rule the monorepo aggregate already applied to itself, so the
per-workspace rows and the total no longer answer the same question two ways.
