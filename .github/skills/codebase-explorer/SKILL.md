---
name: codebase-explorer
description: Multi-phase codebase investigation with context isolation. Use when the user asks to understand how a feature works across a codebase, trace dependencies, map integrations, or investigate an unfamiliar area before making changes. Triggers on requests like "understand how X works", "investigate the codebase", "trace how Y is used across the system".
argument-hint: 'Feature, module, or question to investigate, for example: how Table filters flow from URL to store'
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash
---

# Codebase Exploration (Phased, Isolated)

Follow this procedure for any exploration task. Do not explore the
codebase directly yourself in the main thread — delegate to subagents
and keep this thread clean.

This skill is the single owner of the exploration scratchpad and
crash-recovery procedure. Scratch files live under `.tmp/exploration/`
(gitignored) — never at the repo root.

## Step 0 — Setup

1. Check for `.tmp/exploration/manifest.json`. If present, read it and
   resume from `next_steps` rather than re-exploring `explored_paths`.
   If absent, create it with empty `explored_paths`, `key_findings`,
   `next_steps`.
2. Check for `.tmp/exploration/findings.md`. If absent, create it.
3. Treat `findings.md` as the source of truth for specifics: append
   every relevant path/class/function there immediately (full path +
   one-line description), and check it before each new search so you
   never re-derive recorded information. Update `manifest.json` after
   each significant step — it must survive a crash or session restart.

## Step 1 — Phase 1: Broad exploration

Spawn subagents for distinct, independent investigation threads, for
example:

- `dependency-tracer` — trace how a given module/class is used across
  the codebase.
- `test-finder` — locate all test files covering a given area.
  Each subagent must return only a concise summary (file paths + one-line
  findings), not raw file contents. Append each summary to `findings.md`.

## Step 2 — Synthesise before Phase 2

Before spawning any further subagents:

1. Write a synthesis (max 300 words) of all Phase 1 findings: key
   files/classes, their paths, dependency relationships.
2. Update `manifest.json`: add explored paths, key findings, and set
   `next_steps` to what Phase 2 should do.
3. Prepend the synthesis to every Phase 2 subagent's task prompt under
   the heading "Prior findings — do not re-explore these areas unless
   verification is needed."
   Do not spawn Phase 2 subagents without completing this step. This
   avoids the cold-start problem where Phase 2 duplicates Phase 1 work.

## Step 3 — Phase 2 and beyond

Repeat Step 2's synthesis-and-inject pattern between every subsequent
phase. Update `manifest.json` after each phase completes.

## Step 4 — Final report

Once investigation is complete, summarise `findings.md` for the user in
the main thread. Do not dump raw subagent output — only the distilled
conclusions and the file paths that matter.
