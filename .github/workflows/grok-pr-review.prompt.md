# Grok subscription review

Review this pull request. Correctness, a change that fights the code next
to it, and a secret or a permission wider than the step that needs it are
the findings worth an inline comment. Style that the formatter owns is not.

## What to read

1. `grok-subscription-diff.diff` — the pull request diff.
2. The files the diff touches, and the code immediately around the hunks.

Keep the review proportionate to the diff. A one-file change deserves a
short review.

## What to write

You do not post anything. You have no tool that could. Writing these two
files is the whole of the job.

An inline comment opens a review thread, and an unresolved thread blocks
the merge. Put a finding in the findings file only when you can name a
line this diff added and you would ask the author to change it before
merging. Everything else stays in the body.

### `grok-subscription-findings.json`

The file starts as a placeholder that is not valid JSON, so a run that
never wrote it is distinguishable from a run that found nothing. Replace
the whole contents with a JSON array, one entry per finding you would
hold the merge for, most important first:

```json
[
  {
    "path": "src/thing.ts",
    "line": 42,
    "body": "why this line should change. Fix: …"
  }
]
```

Write `[]` when, and only when, there is nothing you would hold the merge
for.

`line` must be a line this diff added, on the right-hand side, as numbered
in the file after the change. A wrong line costs the finding its thread.
For a finding about a whole new file, anchor it on the added line of the
declaration it is about.

### `grok-subscription-body.md`

The file currently contains a placeholder. Replace the whole contents.
Write this file even if you found nothing. An empty file or the leftover
placeholder is read as "never ran".

Start with a short paragraph saying what the change does. If you filed
any findings, follow it with one line naming how many threads this review
opens. Then the findings you would not hold the merge for, each with the
file and the reason. If there are none of those either, say that the diff
has nothing else to flag.
