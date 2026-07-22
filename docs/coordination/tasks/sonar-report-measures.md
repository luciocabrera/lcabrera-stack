---
id: sonar-report-measures
title: Report what Sonar actually analysed, not just open issues
owner: agent:claude
status: review
branch: sonar-report-measures
area:
  - scripts/sonar-report.mjs
  - scripts/lib/sonar-*
started: 2026-07-22
updated: 2026-07-22
plan: (none)
pr: #264
issue: #255
---

## What

`sonar-report.mjs` queried only `resolved=false`, so `reports/sonar/full-latest.json`
could not distinguish three very different states — genuinely clean, every
finding accepted, or the files not analysed at all. All three printed
`issues: 0`.

The report now also carries the accepted count (with a per-rule breakdown) and
the lines actually indexed per language, and the summary prints both.

The fetch layer moved to `scripts/lib/sonar-api.mjs` first: the script was at
346 code lines against the 350 ceiling, so nothing could be added to it. It is
now 296.

## Why it mattered immediately

It answered #75 on the first run, from the CLI, while the SonarCloud web UI was
returning 403:

```
scope: 59796 lines (css 46, js 6038, postgres 1547, shell 186, ts 51183, yaml 796)  accepted: 10
```

`postgres 1547` with no `plsql` — the migrations are indexed by the correct
engine and clean, not skipped. Four rounds of screenshots could not establish
that.

## Status / next

- Complete; gate green. Awaiting review on #264.
