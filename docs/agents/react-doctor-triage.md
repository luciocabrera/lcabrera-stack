# react-doctor triage record

React Doctor is **enforced**, as of [ADR-055](../decisions/ADR-055-react-doctor-as-a-gate.md):
`vp run react-doctor:verify` runs in `check:push` and in `check-safe.yml`, the tool is
pinned at `catalog:lint`, and `doctor.config.jsonc` at the root holds its config. It is
still not one of the three linters in [AGENTS.md](../../AGENTS.md) §4 — it is a separate
CLI with its own config and report.

**Only error severity blocks.** Everything triaged below is a warning, so this file is
not a list of things failing the build; it is the record of what has already been argued,
so the next agent spends one read instead of re-deriving the same judgements. Warnings
are visible via `vp run react-doctor:report`.

> **Two claims in the previous version of this file were wrong**, and both are corrected
> above. It said React Doctor "documents **no suppression mechanism** — no config entry
> for a single site, no inline comment": it documents both — `ignore.overrides` in the
> config and `react-doctor-disable{,-line,-next-line}` comments. It also said nothing in
> CI runs it and it is not a dev dependency, which ADR-055 changed. Neither was true when
> re-checked against v0.9.1.

**A suppression is not a triage row.** Because those mechanisms exist, they are now
policed: `suppressions:verify` detects every one of them, and inside the four public
packages each needs an argued entry in
[`public-package-suppressions.json`](public-package-suppressions.json). Non-Negotiable
Rule 11 applies unchanged — prefer fixing the code, and record an accepted finding here
rather than silencing it.

Tool-level facts — the rule-family map, which families conflict with our own ADRs, the
verified false positives, and what integrating react-doctor into the gate would require —
are in [`react-doctor-facts.json`](react-doctor-facts.json). Read that before wiring the
tool into anything; this file stays the authority on per-finding reasoning.

The verdicts below were reached by reasoning about collection bounds and call-path
coldness. They have since been **measured against the real functions** —
[`react-doctor-triage-measured.md`](react-doctor-triage-measured.md) carries the numbers,
confirms seven of the eight acceptances, and overturns one. Read it before re-opening
anything here.

## How to use this file

1. Run the tool from the repo root: `vp run react-doctor:report`, then read
   `reports/react-doctor/full-latest.json` (gitignored, ADR-049). For one workspace's
   human-readable view: `cd packages/ui && npx react-doctor@latest --verbose`.
2. For each finding, look for its **file + code shape** below.
3. If it is listed as accepted, it has already been argued — do not "fix" it without
   new evidence that overturns the reasoning recorded here.
4. If it is not listed, triage it and add a row.

**Entries are keyed by file and code shape, never by line number.** Line numbers rot on
the first unrelated edit: fixing the two sites in
`resolveAcceptedUnpinConflictState.util.ts` shortened the file by 6 lines and moved a
third finding in that same file from line 79 to line 73. Cite the shape, and re-run the
tool for current positions.

## Rule: `react-doctor/no-barrel-import` — OFF repo-wide

**Do not re-litigate this one, and do not "fix" the sites it used to flag.** It is
switched off in `doctor.config.jsonc`, with the reasoning inline there and an
`acknowledged` entry in the suppression register.

**What it flagged.** Importing from a relative `index.*` that contains only re-exports —
by far the largest group in the report, and once counted, `packages/ui` was most of it.
It reports at most once per importing file, so its count is a file count, not an
occurrence count.

**Why it does not apply here**, in the order the evidence was gathered:

1. **The rule's own documentation names this exact case a false positive**: "bundlers
   like Vite or Next.js with optimizePackageImports already tree-shake barrels well in
   production." It also self-tags `test-noise`. `optimizePackageImports` is a **Next.js**
   option — it is not a Vite option and there is no Next.js here, so only the Vite half
   of that clause is relevant, and it is the half that applies.
2. **`packages/ui` declares `"sideEffects": false`**, which is what lets a bundler drop
   an unreferenced re-export, and every flagged barrel is a curated list of named
   re-exports with no module-level code.
3. **Measured, not inferred.** Building an entry that imports one symbol from a flagged
   barrel emits that symbol alone: the sibling exports are gone and the barrel module is
   elided entirely, in both a plain-util barrel and a React selector barrel. Had
   tree-shaking not worked, the siblings would have been in the output — the probe could
   have disproved the claim, which is why it is worth citing.
4. **Acting on it would contradict ADR-007.** Rule 2 of
   [ADR-007 (app home)](../../apps/react-router/docs/decisions/ADR-007-barrel-export-boundaries.md)
   _requires_ importing through a curated barrel across a module boundary. Rewriting
   those imports to direct paths would invert the repo's own decision.

**What is still worth doing, separately.** ADR-007 rule 1 says that _inside_ a module,
imports should be direct-file — so an intra-module barrel hop (a file importing `./utils`
from within the same folder) is worth tidying for **cycle risk and import direction**,
which is ADR-007's actual concern. That is a small subset, it is not a bundle-size
matter, and React Doctor cannot identify it: the rule does not model module boundaries.

## Rule: `react-doctor/js-combine-iterations`

**What it flags.** `.map().filter()` / `.filter().map()` adjacency. Category
Performance, severity warning. Prescribed fix: one pass via `.flatMap()`, `.reduce()`,
or `for...of`.

**Its own documented exceptions**, from
<https://react.doctor/docs/rules/react-doctor/js-combine-iterations>:

1. the intermediate array is genuinely used elsewhere, and
2. N is "tiny enough that the extra pass is negligible".

Criterion 2 does most of the work in this package. The collection ceiling here is the
**column list**, and its deliberate stress case is the 150-column route
[`apps/react-router/src/routes/wide-alltypes-150`](../../apps/react-router/src/routes/wide-alltypes-150).
Every flagged site but one runs on a click, drawer-open, loader or mount path.

**Two repo constraints make the prescribed fix costly**, which is why "just apply it"
is the wrong default here:

- Biome `noAccumulatingSpread` is ON, so `[...acc, item]` inside a `.reduce()` is a
  build error. A reduce must mutate a local accumulator.
- [`.claude/rules/typescript.md`](../../.claude/rules/typescript.md) constrains which of
  the three suggested shapes are idiomatic here — read its array-operation guidance
  before applying any of them. In particular, **`flatMap` is not the performance answer**
  the rule's own docs imply: wrapping each kept element in a throwaway array measures
  _slower_ than the `.filter().map()` chain it would replace.

Also note the rule fires on **adjacency**, so deleting a redundant link in the chain
clears it; the surviving `.slice().map()` is not a matched pattern.

### Fixed (do not expect these to reappear)

| File                                                                                                                                                                                                                                          | What was actually wrong                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`resolveAcceptedUnpinConflictState.util.ts`](../../packages/ui/src/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSectionContext/actions/utils/resolveAcceptedUnpinConflictState.util.ts) (both `unpin-beyond` branches) | The trailing `.filter((key) => left.includes(key))` was a **no-op**, and an `O(n·m)` one. `keysToUnpin = {k : k ∈ window ∧ k ∈ left}` was consumed only by `left.filter(k => !keysToUnpin.has(k))`, where `k ∈ left` holds by construction — so the conjunct was a tautology. Deleting it removed a full pass _and_ the `Array.includes` scan. |
| [`resolvePinConflictState.util.ts`](../../packages/ui/src/components/Table/TableSettingsDrawer/ColumnOrderSection/utils/resolvePinConflictState.util.ts) (`move-column` branch)                                                               | `allOrderedKeys` — the identical projection — was already computed unconditionally at the top of the function and then went **unused** in this branch. The chain was a third pass duplicating existing work. Now reuses it.                                                                                                                    |

Neither fix needed `reduce`, `for...of`, or a mutation; both stayed declarative. That is
the bar to aim for: if a "fix" for this rule requires an accumulator, re-read the
exception criteria before writing it.

### Accepted — negligible N (criterion 2)

| File                                                                                                                                                                                                                                                                            | Shape                                                        | Why accepted                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`NotificationCenter.component.tsx`](../../packages/ui/src/components/NotificationCenter/NotificationCenter.component.tsx)                                                                                                                                                      | `NOTIFICATION_CENTER_PLACEMENTS.map(…).filter(…)`            | **N = 4**, a hard-coded constant in [`NotificationCenter.constants.ts`](../../packages/ui/src/components/NotificationCenter/NotificationCenter.constants.ts). More importantly this shape is **load-bearing**: AGENTS.md §4 names this file as the canonical resolution of the Biome `useIterableCallbackReturn` vs `unicorn/no-null` / `no-useless-undefined` conflict — filtering first is what lets the `map` callback always return an element. An inline comment says so. Fusing it re-opens a documented three-linter conflict to save 4 iterations. **Never fix this one.**                                                                                                                                                                                 |
| [`appendPrimaryKeySorting.util.ts`](../../packages/ui/src/routing/shared/appendPrimaryKeySorting.util.ts)                                                                                                                                                                       | `resolvePrimaryKeyColumnKeys(…).filter(…).map(…)`            | The collection is the **primary-key** list, not the column list — every table in the repo declares exactly one `isPrimaryKey` column, so **N = 1**. Runs once per loader/query build. `existingKeys` is already a `Set`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| [`getStaticColumnKeys.util.ts`](../../packages/ui/src/components/Table/utils/getStaticColumnKeys.util.ts)                                                                                                                                                                       | `columns.filter(…).map(…)` into `new Set()`                  | Mount and drawer-Apply only. Because the result is a `Set`, any single-pass form must mutate the Set mid-iteration — the least declarative option available. A 2-line pure expression would become 5 to halve a ≤150 scan.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| [`buildPresetColumnSizing.util.ts`](../../packages/ui/src/components/Table/TableSettingsDrawer/GeneralSettingsSection/utils/buildPresetColumnSizing.util.ts)                                                                                                                    | `columns.map(… as const).filter(([, width]) => width)`       | **Partly OVERTURNED by measurement — see [the POC findings](react-doctor-triage-measured.md).** This row claimed zero measurable gain; a `reduce` writing straight into an object measures ~4× faster (~2 µs/call at 150 columns), because the real cost is `Object.fromEntries` over per-element `as const` tuples, not the double pass the rule flagged. Still one click on a width-preset button, so a candidate rather than an urgency. What stands: **three stacked traps** for any rewrite — the `as const` tuple is what makes `Object.fromEntries` typecheck; the result feeds `Object.fromEntries`; and the filter is a **truthiness** test, so it drops `width === 0` as well as `undefined` — rewriting to `width !== undefined` is a behaviour change. |
| [`useAddFilterSection.hook.ts`](../../packages/ui/src/components/Table/TableSettingsDrawer/FiltersSection/AddFilterSection/useAddFilterSection.hook.ts)                                                                                                                         | `columns.filter((col) => col.isFilterable !== false).map(…)` | Drawer-open only, and memoized by the React Compiler on `[columns, filters]` per [ADR-004 (app home)](../../apps/react-router/docs/decisions/ADR-004-react-compiler.md), so unrelated state changes do not re-run it. Trap: `isFilterable !== false` means **undefined ⇒ filterable**; a rewrite to `if (col.isFilterable)` silently drops every column that omits the flag, which is most of them.                                                                                                                                                                                                                                                                                                                                                                |
| [`AddSortSection.component.tsx`](../../packages/ui/src/components/Table/TableSettingsDrawer/SortingSection/AddSortSection/AddSortSection.component.tsx)                                                                                                                         | `columns.filter((col) => … && sorting.every(…)).map(…)`      | Same `isSortable !== false` trap. Decisively, **the rule targets the wrong cost**: the filter is already `O(columns × sorting)` because of the nested `.every`, which dominates the `.map` entirely. Fusing saves one allocation and leaves the quadratic scan untouched. Measured, that reasoning is right about where the cost is but **wrong that a `Set` of sorted keys is the bigger lever** — the `Set` variant lands level with the fused reduce, both ~0.5 µs at 150 columns on a drawer-open path ([POC findings](react-doctor-triage-measured.md)). Acceptance holds on absolute cost; neither alternative earns the churn.                                                                                                                              |
| [`resolveAcceptedUnpinConflictState.util.ts`](../../packages/ui/src/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSectionContext/actions/utils/resolveAcceptedUnpinConflictState.util.ts) (`reorder-to-fill` branch: `allOrderedColumns.filter(…).map(…)`) | —                                                            | Unlike the two fixed branches in the same file, **no precomputed key array exists in this function**, so there is no zero-cost rewrite. Fusing needs `reduce`+push: a 3-line declarative expression becomes ~10 imperative lines, against `typescript.md`, for ≤150 elements on a modal-accept click.                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

### Accepted — real defect, but the rule's fix is the wrong one

| File                                                                                                                      | Shape                                                                  | Why the fix was rejected                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`resolvePrimaryKeyColumnKeys.util.ts`](../../packages/ui/src/components/Table/utils/resolvePrimaryKeyColumnKeys.util.ts) | `columns.filter((column) => column.isPrimaryKey === true && …).map(…)` | This is the one genuinely warm site — reached per **table row** via [`resolveCrudRowId.util.ts`](../../packages/ui/src/components/Table/utils/resolveCrudRowId.util.ts) → [`TableRowActionsMenu.component.tsx`](../../packages/ui/src/components/Table/TableRowActionsMenu/TableRowActionsMenu.component.tsx). But the rule's premise is false here: the chain is `filter`-then-`map`, so the `.map()` runs over the already-filtered **1–2 element** array, not the column list. Measured: the per-call delta is **flat** across N = 10/30/150 (~20 ns), which localises the entire gain to one array allocation — if a second full traversal were being eliminated the N=150 delta would be ~15× the N=10 delta. The genuine defect is that a **row-invariant** derivation recomputes per row; the fix is hoisting it into the columns store (mirroring the existing `staticKeys` handling), which is ADR-003 / `store-pattern` territory and is tracked as issue #451. Fusing the passes would add a mutating accumulator while leaving the actual `O(m)`-per-row cost in place. |

## Method note

The triage above came from a three-stage pass — classify, author a fix, then
adversarially audit it — and the audit is what changed two conclusions: it rejected an
authored fix that typechecked and passed every gate, on measurement rather than taste.
Worth repeating for the other rule families in the same report, none of which are
triaged yet.

Two habits that paid off, both instances of
[AGENTS.md](../../AGENTS.md) Rule 14:

- **Read the tool's own docs before fixing.** Both accepted-criteria columns above come
  straight from the rule's documentation page. Guessing at "is this a false positive"
  would have been slower and less defensible.
- **Verify the new tests against the pre-fix code.** A test written alongside a fix that
  only passes after it proves nothing about the refactor being behaviour-preserving. The
  two tests added here were confirmed green on the original source first.
