# ADR-013: CQMS CRUD route restructure + shared-UI corrections

**Status:** Accepted

## Context

Direct user review of Step 8 (ADR-012) surfaced four real gaps, backed by
screenshots and a request to "check the other apps when in doubt" rather
than invent new patterns. Each was researched against `apps/react-router`'s
actual code before changing anything, per that instruction.

## Decision

### 1. `SectionCard` extracted from `Settings/SettingsOptionSection`

The bordered "section box" in the Global Settings screenshot (title +
description + content, in a `Card`) already existed — but hardcoded to a
`RadioOptionGroup` as its only possible content
(`SettingsOptionSection.component.tsx`), so CQMS's Forms couldn't reuse it
without duplicating it. Extracted the generic shape into
`packages/ui/src/components/SectionCard/`; `SettingsOptionSection` now
composes it instead of owning its own `Card`/title/description markup.

`Card` itself gained a `customStylex?: StyleXStyles` prop (it had none —
confirmed by reading `Card.types.ts` directly), matching `Button`'s own
established convention, so a `SectionCard` consumer can override
width/height. `new-project`, `edit-project`, and `trigger-scan`'s Forms
(see §3/§4 below) are the first CQMS consumers.

### 2. `Table`'s `actions` prop — first real consumer, wired through `TableLayout`

Confirmed by reading `Table.types.ts`/`TableContent.component.tsx`/
`Title.component.tsx` directly: `Table`'s `actions?: ReactNode` prop was
fully wired to render in the title row (left of the built-in settings
gear) but had **zero real consumers anywhere in the repo** — only a unit
test exercised it. `TableLayoutProps` didn't even `Pick` it from
`TableProps`. Added `'actions'` to that `Pick` list and threaded it through
`TableLayout.component.tsx` to the underlying `Table`. CQMS's project list
(`Cqms.component.tsx`) is the first real consumer: "New Project" now
renders via the Table's own title-row `actions` slot (and the table's own
`metaState.title` renders "Projects" — the separate `<h1>`/header `<div>`
wrapper that duplicated this is gone). `StaticTable` got the same
`actions` prop for parity, though nothing consumes it there yet.

### 3. `/settings` route — was simply missing from `admin_system`

`apps/react-router/src/routes/settings/root.ts` is a two-line re-export of
`@repo/ui/components/Settings` — already a fully shared, app-agnostic
component. `admin_system` never had this route at all. Added the
identical re-export, registered `route('settings', ...)`, and added a
"Settings" item to `admin_system`'s own `getNavigationItems.util.tsx`
(mirroring `apps/react-router`'s).

### 4. CQMS routes restructured to `projects` / `projects/new` / `projects/edit/:id` / `projects/view/:id`

Explicitly requested, not derived from an existing example — confirmed by
research that **no edit route exists anywhere in this repo** (`Form`'s
`mode: 'edit'` had zero production consumers before this ADR, only a unit
test). This establishes that pattern for CQMS, as a template for future
entities, rather than copying one.

- `/cqms` now redirects to `/cqms/projects` (same `redirect()` pattern
  `admin_system`'s own `/` → `/cqms` already used).
- `/cqms/projects` — the list (unchanged file, just re-registered off
  `index` onto its own path).
- `/cqms/projects/new` — unchanged, still create-only.
- `/cqms/projects/edit/:projectId` — **new**. Loader awaits `project`
  directly (needed to pre-fill the `Form` and for the 404 check — same
  justification as every other single-entity await in this route tree).
  Action validates + calls a **new** `updateProject.util.ts`
  (`packages/scan-ingestion/src/queries/`), distinct from
  `registerProject` (which upserts by the `local_path` unique constraint —
  the ad hoc-ingestion matching key, wrong semantics for "rename this
  specific row"). `updateProject` does a real `UPDATE ... WHERE id = $3`.
- `/cqms/projects/view/:projectId` (+ its nested `trigger-scan`/`runs/:runId`/
  `runs/:runId/scans/:scanId` — same sibling-route relationship as before,
  just with `/view/` added to every path string) — the existing
  runs+trend dashboard, unchanged in content, only its URL moved.
- Every internal link (`RunLink`, `ScanLink`, `Cqms.constants.tsx`'s name
  column, both actions' redirects) updated to the new `/view/` paths. The
  project list also gained an "Edit" column (`Cqms.constants.tsx`), and
  the view page gained an "Edit Project" link alongside "Trigger Scan".

### 5. Two more loader awaits converted to streaming

Re-auditing every CQMS loader against the confirmed convention
(`enterprise-orders.loader.ts` streams lists; `order-detail.loader.ts`
awaits only what a 404 check/header genuinely needs) found two remaining
unnecessary awaits, both fixed:

- `scan-detail`'s `report` — was awaited, but nothing about it is needed
  for the 404 check (only `scan` is) or for `jsonSections` (which only
  reads `scan.raw_json`). Now a `reportPromise`, read via `use()` inside a
  new `ScanReportPanel` (mirrors `ProjectTrendPanel`'s established
  shape), wrapped in `<Suspense>` by `ScanDetail`.
- `trigger-scan`'s `scanners` — was awaited for the Form's `options`, but
  nothing else on that page needs it synchronously either. Now a
  `scannersPromise`; a new `TriggerScanForm` child component reads it via
  `use()` and renders the `Form` (fields depend on the resolved scanner
  list), wrapped in `<Suspense>` by `TriggerScan`.

Both `loader` functions are no longer `async` (nothing left to `await`),
matching `enterprise-orders.loader.ts`'s own non-async-function-returning-
a-promise-field shape exactly.

### 6. Padding drift, collapsed table headers, and a standardized "create" button

A follow-up screenshot comparing `enterprise-orders` (populated, evenly
spaced) against `cqms/projects` (blank, unevenly padded, headers collapsed
to sort-icon width) surfaced three more gaps, each traced to a real cause
rather than patched visually:

- **CSS reset drift.** `apps/react-router/src/index.css` has always carried
  a full reset (`box-sizing`, margin/padding zeroing on
  `body`/headings/`p`/lists, font-smoothing, scrollbar styling);
  `apps/admin_system/src/app.css` had almost none of it, so unstyled
  `<h1>`/`<h2>`/`<p>` — including `Table`'s own internal `<h2>` title —
  picked up browser-default margins. Extracted the shared reset to
  `packages/ui/src/design-system/reset.css`; both apps now `@import` it
  instead of one hand-copying the other's rules (or drifting, as here).
- **Collapsed table headers.** `PROJECT_LIST_COLUMNS` and the other three
  CQMS `*.constants.tsx` files never set `minWidth` (unlike
  `EnterpriseOrders.constants.tsx`, which sets `minWidth`/`maxWidth` on
  every column). Added explicit `minWidth` (70–240px, sized per column's
  real content) across all four files. Extended the same fix to
  `inferTableColumnsFromJson.util.ts` — the JSON-explorer's runtime-column
  inference had the identical gap — with a flat `minWidth: 120` default,
  since inferred columns have no per-column authored sizing to draw from.
- **No standardized "create" button.** Built `TableCreateLink`
  (`packages/ui/src/components/Table/TableCreateLink/`) plus a new
  `PlusIcon` so every future entity's list page uses the same
  icon-only-`+`/`color='outline'`/`size='mini'`/tooltip-"Create {title}"
  shape, matching the built-in settings-gear button it always sits next
  to in `Table`'s `actions` slot. `Cqms.component.tsx` is the first
  consumer, sharing its `TITLE` constant between `actions` and
  `metaState.title`.

One real bug surfaced while verifying `TableCreateLink`: `NavLink`'s
`children` prop is required (a visually-hidden label rendered alongside
the icon for accessibility — the same convention `NavigationLauncher`'s
`Button` usage already follows), but the first draft rendered `<NavLink
... />` self-closing with no children. `tsc -p tsconfig.json` (the
project's own root config, `"files": []` + `references` only) silently
type-checks nothing on its own — running `tsc -p tsconfig.app.json`
directly is what actually surfaced `TS2741: Property 'children' is
missing`. Fixed by passing ``{`Create ${title}`}`` as children,
identical text to the tooltip/aria-label.

## Consequences

- The CQMS project entity now has a complete, real list/create/edit/view
  CRUD example — the first in this repo — that a future entity can copy
  instead of re-deriving the pattern from scratch.
- `SectionCard`/`Card.customStylex`/`Table`'s `actions` prop are now
  proven, real capabilities other apps can reach for, not just typed-but-
  unused surface area.
- `apps/react-router`'s own `Settings`/`Card` consumers are unaffected —
  `SettingsOptionSection`'s refactor is behavior-preserving (verified via
  its existing test suite, still passing unmodified).

## Verification performed

`vp check` (fmt+lint+typecheck), `vp run lint:custom-rules`, `vitest run`
— all clean across `packages/ui` (338 files/1400 tests), `packages/scan-ingestion`
(10 files/51 tests, real `cqms_db`), `apps/admin_system` (3 files/15
tests), `apps/react-router` (unaffected, 1/1). Full manual end-to-end pass
against a second real seeded project (via the actual `registerProject`/
`triggerScan`/`ingestReport` functions, not raw SQL): all six routes
(`projects`, `projects/new`, `projects/edit/:id`, `projects/view/:id`,
`runs/:id`, `scans/:id`, `trigger-scan`) plus both the `edit-project` and
`trigger-scan` actions confirmed via `curl` against real rendered HTML —
including confirming the edit action's rename actually persisted on
reload. Settings route confirmed rendering the real `Global Settings`
page. Test data cleaned up afterward.

**§6 follow-up verification:** `tsc -p tsconfig.app.json`, `vp lint`,
`vp fmt`, `vitest run` clean across `packages/ui` (339 files/1401 tests),
`apps/admin_system` (3 files/15 tests), and `apps/react-router` (1/1;
fmt/typecheck clean, its 56 pre-existing `perfectionist/sort-imports`
lint errors confirmed via `git status` to be in files untouched by this
work). Live `curl` against a running `admin_system` dev server confirmed:
the served `app.css` actually contains the imported reset rules; every
`<th>` in `/cqms/projects` carries real `--x-minWidth`/`--x-width` inline
custom properties matching the authored pixel values (no collapsed
headers); and the rendered "+" button has `color='outline'`,
`size='mini'`, the `PlusIcon` SVG, and `aria-label`/tooltip text
"Create Projects", positioned in the `Table` title row next to the
settings-gear button. No test data was created (read-only `GET`
requests), so no cleanup was required.
