---
id: commit-pr-standards
title: Enforced commit-message + PR-description standards (hook + CI gate)
owner: agent:claude
status: active
branch: feat/commit-pr-standards
area:
  - scripts/verify-commit-msg.mjs
  - scripts/verify-pr.mjs
  - scripts/lib/commit-convention.mjs
  - .vite-hooks/commit-msg
  - .github/pull_request_template.md
  - .github/workflows/pr-standards.yml
  - .github/skills/commit-and-pr/**
started: 2026-07-18
updated: 2026-07-18
plan: we-want-to-have-greedy-parrot.md
pr: (none)
---

## What

Make the repo's already-conventional commit + PR style **enforced**, so every
agent (Claude, Copilot, Gemini) and human of any experience follows it flawlessly.
Today it is convention-only — no PR template, no commitlint, no `commit-msg` hook,
no CI check on PR title/body.

Design (single spec → two layers, template == checker == docs):

- `scripts/lib/commit-convention.mjs` — the one spec (allowed types, subject
  rules, required PR sections, workspace-derived scope vocabulary). Pure.
- `scripts/verify-commit-msg.mjs` + committed `.vite-hooks/commit-msg` — local
  Conventional-Commit hook (fast feedback; activates the pre-installed shim).
- `scripts/verify-pr.mjs` + `.github/workflows/pr-standards.yml` (on:
  pull_request, incl. `edited`) — blocking CI gate on PR title + body + each
  commit in the range. `.github/pull_request_template.md` mirrors the required
  sections.
- Registered as `commit:verify` / `pr:verify` in root `package.json`, documented
  in COMMANDS.md; policy in AGENTS.md + a `commit-and-pr` skill.

Shared-doc edits (region-local, not area-locked): `AGENTS.md`, `COMMANDS.md`,
`docs/README.md`, root `package.json`.

## Status / next

- Current step: built + green — spec lib, commit-msg hook, PR gate, template,
  docs all in place; fmt/oxlint/biome/vp check + commands/scripts/skills/
  coordination verifiers + fallow new-only audit all pass. Validator smoke-tested
  (20 commit-msg fixtures + PR cases + the real hook dispatcher path).
- Blockers: none.
- Next: open draft PR → flip status to review → (human) add pr-standards check to
  the `main` ruleset's required checks once it has run on a PR.
