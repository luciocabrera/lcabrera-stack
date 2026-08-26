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
   [ADR-007 (app home)](../decisions/ADR-007-barrel-export-boundaries.md)
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
[`apps/showcase/src/routes/wide-alltypes-150`](../../apps/showcase/src/routes/wide-alltypes-150).
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

| File                                                                                                                                                                                                                                          | What was actually wrong                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`resolveAcceptedUnpinConflictState.util.ts`](../../packages/ui/src/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSectionContext/actions/utils/resolveAcceptedUnpinConflictState.util.ts) (both `unpin-beyond` branches) | The trailing `.filter((key) => left.includes(key))` was a **no-op**, and an `O(n·m)` one. `keysToUnpin = {k : k ∈ window ∧ k ∈ left}` was consumed only by `left.filter(k => !keysToUnpin.has(k))`, where `k ∈ left` holds by construction — so the conjunct was a tautology. Deleting it removed a full pass _and_ the `Array.includes` scan.                                                                                                                                                                                  |
| [`resolvePinConflictState.util.ts`](../../packages/ui/src/components/Table/TableSettingsDrawer/ColumnOrderSection/utils/resolvePinConflictState.util.ts) (`move-column` branch)                                                               | `allOrderedKeys` — the identical projection — was already computed unconditionally at the top of the function and then went **unused** in this branch. The chain was a third pass duplicating existing work. Now reuses it.                                                                                                                                                                                                                                                                                                     |
| [`buildPresetColumnSizing.util.ts`](../../packages/ui/src/components/Table/TableSettingsDrawer/GeneralSettingsSection/utils/buildPresetColumnSizing.util.ts)                                                                                  | The follow-up [the POC findings](react-doctor-triage-measured.md) called for — the one verdict measurement overturned. Now a `reduce` assigning `sizing[column.key]` directly, which drops `Object.fromEntries` and the per-element `as const` tuple (the actual cost, not the second pass the rule flagged). All three documented traps survive the rewrite: the tuple and `fromEntries` are **gone** rather than worked around, and the truthiness test is preserved verbatim so a configured `width === 0` is still dropped. |

Neither fix needed `reduce`, `for...of`, or a mutation; both stayed declarative. That is
the bar to aim for: if a "fix" for this rule requires an accumulator, re-read the
exception criteria before writing it.

### Accepted — negligible N (criterion 2)

| File                                                                                                                                                                                                                                                                            | Shape                                                        | Why accepted                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`NotificationCenter.component.tsx`](../../packages/ui/src/components/NotificationCenter/NotificationCenter.component.tsx)                                                                                                                                                      | `NOTIFICATION_CENTER_PLACEMENTS.map(…).filter(…)`            | **N = 4**, a hard-coded constant in [`NotificationCenter.constants.ts`](../../packages/ui/src/components/NotificationCenter/NotificationCenter.constants.ts). More importantly this shape is **load-bearing**: AGENTS.md §4 names this file as the canonical resolution of the Biome `useIterableCallbackReturn` vs `unicorn/no-null` / `no-useless-undefined` conflict — filtering first is what lets the `map` callback always return an element. An inline comment says so. Fusing it re-opens a documented three-linter conflict to save 4 iterations. **Never fix this one.**                                                    |
| [`appendPrimaryKeySorting.util.ts`](../../packages/ui/src/routing/shared/appendPrimaryKeySorting.util.ts)                                                                                                                                                                       | `resolvePrimaryKeyColumnKeys(…).filter(…).map(…)`            | The collection is the **primary-key** list, not the column list — every table in the repo declares exactly one `isPrimaryKey` column, so **N = 1**. Runs once per loader/query build. `existingKeys` is already a `Set`.                                                                                                                                                                                                                                                                                                                                                                                                              |
| [`getStaticColumnKeys.util.ts`](../../packages/ui/src/components/Table/utils/getStaticColumnKeys.util.ts)                                                                                                                                                                       | `columns.filter(…).map(…)` into `new Set()`                  | Mount and drawer-Apply only. Because the result is a `Set`, any single-pass form must mutate the Set mid-iteration — the least declarative option available. A 2-line pure expression would become 5 to halve a ≤150 scan.                                                                                                                                                                                                                                                                                                                                                                                                            |
| [`useAddFilterSection.hook.ts`](../../packages/ui/src/components/Table/TableSettingsDrawer/FiltersSection/AddFilterSection/useAddFilterSection.hook.ts)                                                                                                                         | `columns.filter((col) => col.isFilterable !== false).map(…)` | Drawer-open only, and memoized by the React Compiler on `[columns, filters]` per [ADR-004 (app home)](../decisions/ADR-004-react-compiler.md), so unrelated state changes do not re-run it. Trap: `isFilterable !== false` means **undefined ⇒ filterable**; a rewrite to `if (col.isFilterable)` silently drops every column that omits the flag, which is most of them.                                                                                                                                                                                                                                                             |
| [`AddSortSection.component.tsx`](../../packages/ui/src/components/Table/TableSettingsDrawer/SortingSection/AddSortSection/AddSortSection.component.tsx)                                                                                                                         | `columns.filter((col) => … && sorting.every(…)).map(…)`      | Same `isSortable !== false` trap. Decisively, **the rule targets the wrong cost**: the filter is already `O(columns × sorting)` because of the nested `.every`, which dominates the `.map` entirely. Fusing saves one allocation and leaves the quadratic scan untouched. Measured, that reasoning is right about where the cost is but **wrong that a `Set` of sorted keys is the bigger lever** — the `Set` variant lands level with the fused reduce, both ~0.5 µs at 150 columns on a drawer-open path ([POC findings](react-doctor-triage-measured.md)). Acceptance holds on absolute cost; neither alternative earns the churn. |
| [`resolveAcceptedUnpinConflictState.util.ts`](../../packages/ui/src/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSectionContext/actions/utils/resolveAcceptedUnpinConflictState.util.ts) (`reorder-to-fill` branch: `allOrderedColumns.filter(…).map(…)`) | —                                                            | Unlike the two fixed branches in the same file, **no precomputed key array exists in this function**, so there is no zero-cost rewrite. Fusing needs `reduce`+push: a 3-line declarative expression becomes ~10 imperative lines, against `typescript.md`, for ≤150 elements on a modal-accept click.                                                                                                                                                                                                                                                                                                                                 |

| [`buildOrderBySorting.util.ts`](../../packages/ui/src/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSectionContext/actions/utils/buildOrderBySorting.util.ts) | `sorting.filter(…).map((sort) => sort.columnKey)` | **Introduced deliberately in #462**, and accepted under the same criterion rather than worked around. The collection is `sorting` — the active sorts, a handful of entries — not the column list. The chain was added to drop sorts naming a column `columnOrder` does not contain; the first draft wrote it `.map().filter()`, which `typescript.md` explicitly inverts so the map runs on the narrowed input. Both orders fire this rule, so inverting it was correct and did not silence anything. Splitting the chain across two statements would clear the finding without changing the work done — a workaround, banned by Rule 10 — and the single-pass forms are `reduce`+push or `for...of`, which ADR-054 says to reach for on evidence rather than instinct. There is no evidence here: this is a drawer click over a handful of sorts. |

### Accepted — the app workspaces, same criterion

The gate scans all three React workspaces, so a `packages/ui`-only run (the
`cd packages/ui && npx react-doctor@latest` recipe above) does not show these.
Each is criterion 2, and none has the precomputed-array escape hatch the two
fixed sites had.

| File                              | Shape                                            | Why accepted                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `RoleDetail.component.tsx`        | `permissions.filter(assignedIds.has).map(…)`     | N is the permission catalogue (tens). Already uses a `Set` for the membership test, so the part that could have been quadratic is not.                                                                                                                                                                                                                                                                                                                                                           |
| `useFolderSnapshotUpload.hook.ts` | `files.map(→ {file, key}).filter(!ignored(key))` | **The largest N in the report** — a picked project folder, thousands of files — and the one place the `.map().filter()` order is _not_ invertible: the predicate tests `key`, which the map computes. So `resolveArchiveEntryKey` does run for files about to be dropped. Accepted anyway on absolute cost: this is the prelude to reading and zipping every one of those files, which is orders of magnitude more work than the projection. Re-open it with a profile, not by reading the code. |

The enterprise-orders `toOrderQuerySort` util was a fourth entry here, on the same
reasoning as `buildOrderBySorting`. It stopped firing when the util was promoted
to the generic [`toQuerySort`](../../packages/ui/src/routing/shared/toQuerySort.util.ts),
whose filtering half is the pre-existing `sanitizeSorting` — so the chain now spans
a module boundary and the rule, which fires on adjacency, no longer matches. **That
is not a fix**: both passes still run, exactly as before. The acceptance above is
what still justifies them; do not read the clean report as the finding having been
addressed, and do not split a chain across modules to clear this rule (Rule 10).

### Accepted — real defect, but the rule's fix is the wrong one

| File                                                                                                                      | Shape                                                                  | Why the fix was rejected                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`resolvePrimaryKeyColumnKeys.util.ts`](../../packages/ui/src/components/Table/utils/resolvePrimaryKeyColumnKeys.util.ts) | `columns.filter((column) => column.isPrimaryKey === true && …).map(…)` | This is the one genuinely warm site — reached per **table row** via [`resolveCrudRowId.util.ts`](../../packages/ui/src/components/Table/utils/resolveCrudRowId.util.ts) → [`TableRowActionsMenu.component.tsx`](../../packages/ui/src/components/Table/TableRowActionsMenu/TableRowActionsMenu.component.tsx). But the rule's premise is false here: the chain is `filter`-then-`map`, so the `.map()` runs over the already-filtered **1–2 element** array, not the column list. Measured: the per-call delta is **flat** across N = 10/30/150 (~20 ns), which localises the entire gain to one array allocation — if a second full traversal were being eliminated the N=150 delta would be ~15× the N=10 delta. The genuine defect is that a **row-invariant** derivation recomputes per row; the fix is hoisting it into the columns store (mirroring the existing `staticKeys` handling), which is ADR-003 / `store-pattern` territory and is tracked as issue #451. Fusing the passes would add a mutating accumulator while leaving the actual `O(m)`-per-row cost in place. |

## Rule: `react-doctor/js-set-map-lookups` — promoted to `error`

**What it flags.** `array.includes()` evaluated inside a loop or an iteration
callback, so the membership test rescans the whole list per element. Category
Performance, originally severity warning.

**Verdict: fixed everywhere and promoted to `error`** in `doctor.config.jsonc`
(#460 for the shared table/list utils, #462 for `ColumnOrderSection`). Nothing is
accepted under this rule — unlike its sibling above, the rule is reliably right
here. A membership scan inside a loop is quadratic whatever the constant factor,
and every fix was a local `new Set(...)` that left the surrounding expression
declarative. That difference is the whole reason one rule blocks and the other
does not: `js-combine-iterations` asks you to trade readability for a constant
factor that measurement says is usually not there, while this one removes a real
asymptotic term.

**Promotion is what makes it stick.** React Doctor has no baseline file, so
severity is the only mechanism separating inherited debt from new — with the rule
left at `warn`, every one of these could come straight back and the gate would
still exit 0.

**Two shapes needed care rather than a hoisted `Set`**, and both are the same
trap: the array being searched is _rewritten by the loop doing the searching_.

- [`pinAllBetween.util.ts`](../../packages/ui/src/components/Table/TableSettingsDrawer/ColumnOrderSection/utils/pinAllBetween.util.ts)
  guards on `next.left`/`next.right` while pushing to them, so a `Set` built once
  from `columnPinning` answers for the input rather than the partially-built
  result. It keeps membership mirrors updated in step with the arrays. This also
  deleted a per-iteration `.filter()` over the opposite side — an `O(n·m)` the
  rule did not flag.
- [`restoreStaticPinnedColumns.util.ts`](../../packages/ui/src/components/Table/TableSettingsDrawer/ColumnOrderSection/utils/restoreStaticPinnedColumns.util.ts)
  reassigned `nextPinning` inside the loop. Here the evolving read turned out to
  be unnecessary — `staticKeys` is a `Set`, so every key is distinct and a
  membership test taken up front cannot be invalidated by a later restore — which
  collapsed the loop into two independent selections.

Anything else in this family: hoist a `Set` from the value read _at that point_,
and check whether the loop writes to it before assuming you can.

**`getIsContiguousPin` keeps its manual index loops on purpose.** They look like
`slice().every()`, and are not: when the column is absent `index` is `-1`, and
`slice(0, -1)` means "all but the last" rather than the empty range the loop
walks.

## Rule: `react-doctor/js-index-maps` — fixed

**Verdict: fixed, nothing accepted.** Same family as `js-set-map-lookups` and
reliably right for the same reason — it removes an asymptotic term, not a
constant factor.

[`getNormalizedColumns.util.ts`](../../packages/ui/src/components/Table/utils/getNormalizedColumns.util.ts)
ran `sorting.find(…)` per column. Reading the flagged line only tells half the
story: the next line ran `sorting.indexOf(currentSort)`, a **second** full scan
the rule did not flag, so the loop was `O(columns × sorting)` twice over. Both
collapse into one `Map` built before the loop.

Two things to preserve in any future edit here: the map is built **first-entry-wins**
(`if (!map.has(key))`), because `find` returned the first match and `indexOf`
returned that same object's index — a plain `new Map(sorting.map(…))` keeps the
_last_ and silently changes multi-sort priority when a key repeats. And the value
type is `SortingState<TData>[number]['direction']`, not a hand-written
`'asc' | 'desc'`: `SortDirection` includes `undefined`, which a literal union
rejects at the assignment.

## Rule: `react-doctor/js-hoist-intl` — cost fixed, finding accepted

**Read this before "fixing"
[`getCurrencySymbol.util.ts`](../../packages/ui/src/components/Form/fields/CurrencyField/utils/getCurrencySymbol.util.ts)
again — it still reports, and that is the expected state.**

The rule fires on `new Intl.X(…)` lexically inside a function body. Probed rather
than inferred, with four variants in a scratch file: module-scope construction is
clean, and a **memo cache, a module-scope factory, and the current shape all
fire** — the constructor is still inside a function in every one of them. A fifth
probe showed a `useMemo` callback is exempt.

So the rule's two exits are module scope or `useMemo`, and neither is available:
the currency varies per call, and ADR-004 (React Compiler owns memoization) means
`packages/ui` contains no `useMemo` at all — verify with
`grep -rn "useMemo" packages/ui/src --include=*.tsx | grep -v test`. The `useMemo`
form would also be _worse_: it memoizes per component instance, so every
`CurrencyField` mount rebuilds the formatter anyway.

**What was fixed is the cost the rule is pointing at, which was real and large.**
Constructing the formatter dominated the function by three orders of magnitude —
it loads locale data — so the resolved _symbol_ is now memoized at module scope,
keyed by `locale:currency`. Re-measure with `node -e` against the two shapes
rather than quoting a figure from here.

Two notes for anyone editing it. The key includes the locale so a future
non-constant `getDefaultLocale` cannot serve another locale's symbol from the
cache. And the `catch` path caches too — a code `Intl` rejects throws
deterministically, so re-throwing per render bought nothing.

This is the repo's first module-scope mutable cache in a public package
(`grep -rn "new Map()" packages/*/src` was empty), so it is a deliberate
exception to the "all `*.util.ts` are pure" line in `typescript.md`, not an
oversight. The exported function stays referentially transparent — same input,
same output, no observable effect — which is the property that rule protects.

## Rule: `react-doctor/no-many-boolean-props` — false positive

[`ColumnOrderItemContent.component.tsx`](../../packages/ui/src/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSectionBody/ColumnOrderItemContent/ColumnOrderItemContent.component.tsx)
takes `isBusy`, `isPinned`, `isStatic`, `isVisible`.

The rule's own validation step is the answer: _"confirm they really are
mutually-exclusive booleans."_ **They are not.** All sixteen combinations are
meaningful — a column can be busy and pinned and static and visible at once — so
there is no variant to extract. `isPinned` and `isVisible` are bound straight to
`isChecked` on two independent `ToggleSwitch`es; they are row **data**, not
styling modes. `isStatic` feeds `isDisabled` on both, `isBusy` feeds `isBusy` on
both.

Applying the prescribed fix (a `variant` union, or compound subcomponents) would
mean inventing a variant axis that does not exist and encoding two independent
toggle values into one enum. Do not do it. The rule is a name-prefix heuristic and
it caught four independent state flags.

## Fixed without argument

Straightforward, and recorded only so they are not re-derived.

| Rule                               | Site                                | What was wrong                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `rendering-svg-precision`          | `EraserIcon`, `RefreshIcon`         | Figma-export coordinates carrying 4–5 decimals in a `0 0 16 16` viewBox. Rounded to 2. **Fix every offending line in the file, not the reported one** — the rule reports once per file, so `RefreshIcon`'s remaining two paths would simply have taken the flagged line's place. Shared endpoints were rounded consistently so the arrowheads still meet the arcs. |
| `prefer-module-scope-static-value` | `SettingsTabs`, `VirtualListFooter` | `tabs` / `modes` rebuilt per render with no local-state input. Hoisted. In `VirtualListFooter` only `modes` moves — the sibling `modeConfig` reads live counts and must stay.                                                                                                                                                                                      |
| `no-unknown-property`              | `TooltipTrigger`                    | `popoverTarget` on a `<span>`. React does render the attribute (the rule's "React ignores it" wording is loose) but only `button`/`input` can be popover invokers, so it was inert — `Tooltip` drives the popover with `showPopover()`/`hidePopover()` on a ref. Removed, and a test now asserts its absence.                                                      |
| `no-pass-live-state-to-parent`     | `useVirtualSelectDropdown`          | `onOpenChange` fired from a `useEffect`, so the parent rendered once with the stale value and got a spurious `false` on mount. Now called from the two handlers that change the state. Safe because every consumer initialises its own mirror to `false`, so the mount call was already a no-op.                                                                   |

## The app workspaces

Beyond the array chains above, and all fixed:

- **`zod-v4-prefer-top-level-string-formats`** — every occurrence was the same
  shape, `z.string().uuid(…)` → `z.uuid(…)`, across an admin app's route
  schemas/loaders/actions. Message arguments carry over unchanged. Two test files
  the report did not list were swept as well, so the pattern is gone rather than
  reduced.
- **`zod-v4-no-deprecated-error-customization`** — `z.string('A required.')` →
  `z.string({ error: 'A required.' })`. Note `z.uuid('Pick a user.')` on a
  neighbouring line does **not** fire and must not be "fixed": the rule's legacy
  first-arg-string shape covers only `bigint`/`boolean`/`date`/`number`/`string`.
- **`control-has-associated-label`** — two unlabelled file inputs in
  `ProjectSyncPanel`, given `aria-label`s. Worth knowing: this rule's documented
  failure mode is a false **negative** — a `{...props}` spread or any
  `{expression}` child counts as a label, so a green result here is weaker
  evidence than it looks.
- **`server-sequential-independent-await`** — `projectDetail.loader.ts` awaited
  `getProjectHasActiveRun` and `checkUserPermission` in sequence. They read
  different tables and neither uses the other's result, so they are raced with
  `Promise.all`. Both stay awaited rather than deferred, which the surrounding
  comment explains is deliberate.

### `no-locale-format-in-render` — fixed, and the decision behind it

`RunLink.component.tsx`
rendered `new Date(run.created_at).toLocaleString()`, a genuine SSR hydration
mismatch: the server formats in its locale and zone, the browser in the user's.
Recorded here because the fix was a **product** choice, not a code one — every
option changes what a reader sees, so a later reader should not have to re-derive
why this one was taken (#473).

**Chosen: an explicit locale and `timeZone: 'UTC'`, labelled `UTC` in the link
text.** An absolute, labelled instant is what a shared operations surface wants —
two people comparing the same run from different zones read the same string — and
it is the only option that is both deterministic and keeps the time of day.

Rejected, with the reason each was rejected:

- **`formatDate({ preset: 'medium' })` alone**, the convention the sibling
  `CappedLlmUsageAttemptsTable` follows. It pins the locale, but every preset is
  `dateStyle`-only, so **the time of day disappears** and several runs on one day
  collapse into indistinguishable links. It also does not fully fix the bug: with
  no `timeZone` the _date_ still flips across midnight.
- **Formatting after mount in an effect.** Keeps each reader's local time, at the
  cost of a flash of fallback content and an effect on a render path.

The cost of the chosen option is that timestamps shift for readers outside UTC,
which is why the zone is shown rather than implied. Per-user zone preference is a
possible follow-up, deliberately not done here.

This needed `timeStyle` and `timeZone` on `@lcabrera/utils`'s `formatDate` — a
published-surface change, so it carries a changeset and a regenerated
`reports/api-surface/utils.txt`. Both options are additive: omitting them gives
byte-identical output, asserted by a test that passes on the pre-change
implementation.

## Reading the report without getting a wrong answer

`reports/react-doctor/full-latest.json` has four independent ways to produce a
confident, well-formed, wrong answer. Two agents hit three of them in one session,
each while being careful. Use this shape:

```js
const report = JSON.parse(
  readFileSync('reports/react-doctor/full-latest.json', 'utf8'),
);
const found = report.diagnostics.filter((d) => d.rule === 'js-set-map-lookups');
const repoRelativePath = (d) => d.id.split('::')[0];
```

- **Read `report.diagnostics` once.** The same diagnostics appear again under
  `report.projects[*].diagnostics`. The projects partition cleanly, so this is not
  duplication to dedupe — a recursive walk simply collects both arrays and doubles
  every count. `report.summary` is computed over the correct set, which is why the
  gate itself is unaffected.
- **Filter on the bare rule name.** `d.rule` is `"js-set-map-lookups"`; the
  `"react-doctor"` prefix lives in `d.plugin`, and the slash form appears only
  inside `d.id`. Filtering on the prefixed form matches nothing and reports zero
  findings.
- **There is no `d.file`.** It is `d.filePath`, and reading the missing one yields
  `undefined`, so every path test silently fails.
- **`d.filePath` is project-relative, not repo-relative.** A `startsWith('packages/ui/')`
  test matches nothing; more importantly the field cannot identify a workspace at
  all, so two projects sharing a relative path are indistinguishable by it. Use
  `d.id.split('::')[0]`. Note the same project-relative convention governs
  `ignore.overrides[].files` globs in `doctor.config.jsonc`, where a repo-relative
  glob matches nothing and reads exactly like the override not being there.

**Plant a violation by reverting a real finding, not by writing one.** Confirming
the `error` promotion, a hand-written `needles.filter((n) => haystack.includes(n))`
— both arrays destructured parameters — did not fire, and the resulting clean run
is indistinguishable from the rule being switched off. Reverting one of the fixes
above failed the gate immediately, naming both findings. Variants using a property
access, a `const` bound from one, `.map()` and `.filter()` all fire; the exact
boundary was not isolated, so treat a hand-written plant as needing its own proof
that it fires before it can serve as evidence for anything else.

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
