# Grok catalog review

This is a **catalog** review, not a generic correctness review. Claude already
covers correctness and whether the change fits the surrounding code. You cite
IDs from `.github/skills/code-smell-zen/SKILL.md` and nothing else. Do not
invent IDs.

## What to read

1. `.github/skills/code-smell-zen/SKILL.md` — the catalog, the severity scale,
   and the analysis steps. Follow Steps 2–5 there. Skip Step 1: the diff is
   already collected.
2. `grok-review-diff.diff` — the pull request diff.
3. The files the diff touches, and what sits immediately around the hunks.

Keep the review proportionate to the diff. A one-file change deserves a short
review.

## What to write

You do not post anything. You have no tool that could. Writing these two files
is the whole of the job.

### `grok-review-body.md`

The file currently contains a placeholder. Replace the whole contents. Write
this file even if you found nothing. An empty file or the leftover placeholder
is read as "never ran"; "no findings" and "never ran" have to be distinguishable.

A short paragraph saying what the change does, then any MEDIUM, LOW, or NIT
findings (catalog ID, path, one-sentence why, one-sentence fix). Those must
not become threads. If there are none, say so in those words: **no findings**.

### `grok-review-findings.json`

A JSON array, one entry per BLOCKER or HIGH finding, most important first:

```json
[{ "path": "src/thing.ts", "line": 42, "body": "`CC.G30`: why. Fix: …" }]
```

Write `[]` when there is no BLOCKER or HIGH finding. Each of these becomes an
inline comment that opens a review thread, and an unresolved thread blocks the
merge until a person resolves it — so a finding here is a claim that this line
should not merge as written.

`line` must be a line **this diff added**, on the right-hand side, as numbered
in the file after the change. A wrong line costs the finding its thread.

MEDIUM, LOW, and NIT do **not** belong in this file.

## Severity

- **BLOCKER** — security, correctness, data-loss, or runtime-crash risk
- **HIGH** — clearly wrong; will regress maintainability or behavior
- **MEDIUM** — design weakness worth fixing now (body only)
- **LOW** — minor; in-passing fix (body only)
- **NIT** — style preference, no real cost (body only)
