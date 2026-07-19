---
id: ui-form-showcase-enhancements
title: '@repo/ui Form showcase enhancements (read-only display, card groups, span rows, currency, glass recipe, radio accent)'
owner: agent:claude
status: review
branch: feat/ui-form-showcase-enhancements
area:
  - packages/ui/src/components/Form/**
  - packages/ui/src/components/Modal/**
  - packages/ui/src/components/RadioOptionGroup/**
  - packages/ui/src/design-system/**
started: 2026-07-19
updated: 2026-07-19
plan: ~/.claude/plans/let-s-create-a-detailed-golden-map.md
pr: https://github.com/luciocabrera/vite-react-compiler/pull/97
issue: '#79'
---

## What

Track 1 of the secured enterprise-orders Form showcase epic (#79): additive,
opt-in `@repo/ui` enhancements — sub-issues #80–#85:

- #80 read-only display mode for Form `view`
- #81 collapsible + card-framed group sections
- #82 column-span / grid rows
- #83 formatted currency/number Form field
- #84 shared glass surface recipe + tokenized gradient (Modal refactor)
- #85 radio-card selected accent + Form input polish

## Status / next

- Current step: all six sub-issues (#80–#85) implemented, tested, green gate, pushed
- Blockers: none
- Next: PR #97 review + merge
