# JsonExplorer Architecture

Presentational viewer for CQMS's raw scan JSON (`cqms.scans.raw_json`):
one `Tabs` strip (section-picking) and, per section, a real `Table` fed
already-computed columns — plus a per-section "copy raw JSON" button.

## Public API

- `JsonExplorer` — `sections: readonly JsonExplorerSection[]`, where each
  section is `{ label, columns, rows }`.

**This component does no JSON-walking or column inference itself.**
`inferTableColumnsFromJson.util.ts` (`Table/utils/`) already exists and is
what computes `columns` from a raw `Record<string, unknown>[]` — that call
happens in the consuming route's **loader**, server-side, per TECH_SPEC
§2.9's explicit rule (same one `Table`'s own runtime-columns work already
established): JSON-shape inference is a loader's job, not a client
component's. `JsonExplorer` only ever receives pre-shaped `sections`.

## Composition

- `Tabs` (existing component) — one tab per section, `header: section.label`.
- `StaticTable` (`components/StaticTable/`) — wires one section's
  already-resolved `rows`/`columns` into the real `Table` sort/filter/pin
  machinery. Originally built as a private delegate here, then promoted to
  its own public component once CQMS's other list routes (projects, runs,
  scans, findings — Implementation Plan step 8) turned out to need the
  identical "already-resolved rows into `Table`" wiring — see its own
  ARCHITECTURE.md for why it skips `TableSuspenseBoundary`/`dataPromise`.
- `CopyButton` — one per section, copies that section's `rows` as
  pretty-printed JSON text (the "copy raw JSON" requirement from TECH_SPEC
  §2.9), not the whole `scans.raw_json` blob — the tab you're looking at is
  what gets copied.

## Why this needed a real (unmocked) integration test

`Table`'s column-sort action reaches through `useFetcher` (needs a real
data router) and a notification hook (needs `NotificationProvider`) even
in the simplest render — a shallow/mocked test would not have caught either
requirement. `JsonExplorer.test.tsx` renders the actual `Table` +
`AppProviders` + a memory router with the `/_action/persist-cookie` route
stubbed, the same stack any real CQMS route already sits inside.

## File Structure

- `JsonExplorer.component.tsx` — `Tabs` + per-section `CopyButton` + `StaticTable`
- `JsonExplorer.stylex.ts` — section header layout only
- `JsonExplorer.types.ts` — `JsonExplorerProps`, `JsonExplorerSection`
- `JsonExplorer.test.tsx` — real integration render (see above)
- `index.ts` — barrel: component + both types

## Consumer

CQMS's `scan-detail` route (Implementation Plan step 8) — its loader calls
`inferTableColumnsFromJson` against the relevant sections of a scan's
`raw_json` and passes the result straight through as `sections`.
