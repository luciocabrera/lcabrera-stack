---
id: sonar-main-vulnerabilities
title: Clear the 12 Sonar vulnerabilities on main
owner: agent:claude
status: active
branch: sonar-main-vulnerabilities
area:
  - apps/scan-orchestrator/src/queue/runQueuedScan.ts
started: 2026-07-21
updated: 2026-07-21
plan: (none)
pr: (none)
issue: #249
---

## What

`main`'s Sonar quality gate is red on 12 VULNERABILITY findings: ten in the
`admin_system` Dockerfile and two `typescript:S4036` PATH-lookup findings. The
96 code smells are out of scope — 80 of them are the PL/SQL dialect noise
tracked in #75, whose fix has not taken effect.

Ten of the twelve are in a Dockerfile that has never worked: it arrived with the
app's scaffold commit, is referenced by no workflow, compose file or doc, and
fails on its first `COPY` because none of the paths it expects exist here. It is
deleted rather than repaired — a container build for `admin_system` should be
written against the actual monorepo when something needs one.

Of the two `typescript:S4036` PATH findings, only one is real. The rule is
purely syntactic on the first argument to `execFileSync` and never inspects
`env`, so `runGit.util.ts` — which already pins `PATH` to root-owned directories,
verified to govern resolution — is left exactly as it is and marked reviewed in
SonarQube Cloud. Rewriting working code to satisfy a check that cannot see the
mitigation would be a dodge, not a fix.

`ws-runs-auth` (#66) claims all of `apps/scan-orchestrator/**`, so the register
flags an overlap. It is file-disjoint: that task works in `ws/`, `config/` and
`server.ts`, while this one changes a single line of `queue/runQueuedScan.ts`.

## Status / next

- Current step: PR open
- Blockers: none
- Next: mark the `runGit.util.ts` S4036 finding as safe in SonarQube Cloud, then
  confirm on the next `main` analysis that no VULNERABILITY remains.
