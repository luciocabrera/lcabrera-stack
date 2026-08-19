---
id: grouping-presets-totals
title: Grouping presets and configurable totals placement
owner: agent:claude
status: active
branch: chore/578-grouping-presets-totals
area:
  - packages/ui/src/components/Table/contexts/TableConfig/**
  - packages/ui/src/components/Table/TableSettingsDrawer/GroupingSection/**
  - packages/ui/src/routing/**
  - packages/ui/src/utils/urlState/**
  - apps/react-router/src/routes/enterprise-orders/**
started: 2026-08-19
updated: 2026-08-19
plan: (none)
pr: #816
issue: #578
---

## What

A route can declare a default grouping and optionally lock it, and totals
placement becomes a user setting that reaches the emitted `ORDER BY`.

## Status / next

- Current step: implementing
- Blockers: none

## Decisions

**Totals placement travels in both channels.** It has to satisfy two criteria
that no single channel meets: it must persist across sessions (cookie) and it
must reach the SQL the loader emits (search param, because a cookie-only
`persist-cookie` entry answers `204` and `shouldRevalidatePersistCookieAction`
skips the refetch — the toggle would change nothing until an unrelated
navigation). One `PersistCookieEntry` already carries both, so this needs no
change to the shared action. The URL wins where both are present; absent both
the placement is `last`, which is what `buildGroupOrderByClause` already
defaults to.

**A route default forces "explicitly ungrouped" to become a real state.**
`serializeGroupingToURL` currently returns `undefined` for an empty key list so
the param is dropped, and `applySearchParamUpdates` deletes an empty value — so
"cleared" and "never grouped" are the same URL. That conflation is deliberate
today and is stated in the serializer. A default breaks it: with the param
absent the default re-applies, so clearing it would be undone by the next
navigation that writes any other param — a filter change would silently
re-group the table. So when the route declares a default, clearing serializes
the empty envelope instead of dropping the param. Routes without a default keep
byte-identical URLs.

**A locked preset locks the grouping shape, not the measures.** Keys, mode and
granularity are fixed; aggregates stay editable, because a curated grouping
says how rows are grouped rather than what is measured. The lock is applied at
every surface that mutates the shape — the drawer picker, the header menu's
group-by/clear commands, and the per-key granularity select — not only at the
drawer, since hiding one surface while another still edits is the reachability
failure #814 shipped.
