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

**Give every finding a severity before you decide which file it goes in.** The
severity is what routes it, and the routing is the only thing that decides
whether the finding opens a review thread or scrolls past in a summary. A
finding written into the body carries no thread, holds no merge, and is read as
"the reviewer did not think this had to change".

## Severity

- **BLOCKER** — security, correctness, data-loss, or runtime-crash risk
- **HIGH** — clearly wrong; will regress maintainability or behavior
- **MEDIUM** — design weakness worth fixing now (body only)
- **LOW** — minor; in-passing fix (body only)
- **NIT** — style preference, no real cost (body only)

Calibrate against what you wrote, not against how the finding feels. If you can
name the file, name a line **this diff added**, and write a concrete fix the
author could apply, the finding is at least **HIGH** unless leaving it in costs
nothing but taste. Duplication (`CC.G5`), a new file that contradicts its
siblings in the same diff (`CC.G11`), and state mirrored through an effect
(`REACT.EFFECT-STATE-SYNC`) are HIGH by default: each is a defect every later
change pays for. Keep MEDIUM and below for what you would **not** ask the author
to change before merge.

### `grok-review-findings.json`

The file starts as a placeholder that is not valid JSON, so a run that never
wrote it is distinguishable from a run that found nothing. Replace the whole
contents with a JSON array, one entry per BLOCKER or HIGH finding, most
important first:

```json
[{ "path": "src/thing.ts", "line": 42, "body": "`CC.G30`: why. Fix: …" }]
```

Write `[]` when — and only when — there is genuinely no BLOCKER or HIGH finding.
Each entry becomes an inline comment that opens a review thread, and an
unresolved thread blocks the merge until a person resolves it, so an entry here
is a claim that this line should not merge as written.

`line` must be a line **this diff added**, on the right-hand side, as numbered
in the file after the change. A wrong line costs the finding its thread. For a
finding about a whole new file, anchor it on the added line of the declaration
it is about.

MEDIUM, LOW, and NIT do **not** belong in this file.

### `grok-review-body.md`

The file currently contains a placeholder. Replace the whole contents. Write
this file even if you found nothing. An empty file or the leftover placeholder
is read as "never ran"; "no findings" and "never ran" have to be distinguishable.

A short paragraph saying what the change does, then any MEDIUM, LOW, or NIT
findings, each one opening with its severity: `**MEDIUM** \`CC.G11\` —` path,
one-sentence why, one-sentence fix. If there are none, say so in those words:
**no findings**.

Do not restate a BLOCKER or HIGH finding here. It is already a thread; a second
copy in the body only makes the thread look optional.

## Before you finish

Read back what you wrote. If the body names a finding that has a path and a
concrete fix while the findings file is `[]`, you classified for comfort rather
than for the catalog — reclassify it and move it.
