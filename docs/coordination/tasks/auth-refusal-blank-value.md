---
id: auth-refusal-blank-value
title: fix(showcase): the auth refusal loses its variable name when the value is blank
owner: agent:claude
status: active
branch: chore/977-auth-refusal-blank-value
area:
  - apps/showcase/src/auth/**
  - apps/showcase/src/routes/login/**
  - apps/showcase/*.example
  - COMMANDS.md
started: 2026-08-26
updated: 2026-08-26
plan: (none)
pr: #978
issue: #977
---

## What

fix(showcase): the auth refusal loses its variable name when the value is blank

## Status / next

- Current step: the four notes #972's final review left in the review body
  rather than as threads, none of which was read before it merged. The blank
  value is the functional one — `.min(1)` rejected `''` with its own "Too small"
  and named no variable, so a deploy platform that declares a variable and leaves
  it empty got no guidance; the refusal is now on the length check too. The
  permitted modes are spelled from `DEVELOPMENT_MODES` rather than written twice,
  the three tests that read the ambient env at module scope name their mode, the
  docblock is trimmed to what the code cannot say, and the app has a tracked env
  example.
- Verified rather than assumed: `z.string({ error }).min(1, error)` covers both
  cases and `z.string({ error: () => msg }).min(1)` does not — probed against the
  resolved Zod 4.4.3. Neutralising the fix fails exactly the blank-value test,
  with the suite total unchanged.
- Blockers: none
- Next: #972's merged description still describes its first draft; correcting it
  is part of this issue and needs no code. Then review rounds on #978.
