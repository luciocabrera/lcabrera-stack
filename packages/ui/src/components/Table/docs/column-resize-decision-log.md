# Column Resize — Living Decision Log

**Status:** 🟡 Open — actively iterating, no decision made
**Scope:** `Table/TableHeaderCell/ResizeHandle/`, `Table/hooks/useColumnResize.hook.ts`, `Table/ColumnSettingsDrawer/`, `Table/TableHeaderCell/TableHeaderActionsMenu/`
**Started:** 2026-07-17 · **Last updated:** 2026-07-17
**Supersedes:** `resize-handle-keyboard-access.md` (removed — it carried a factual error we've since corrected; everything still valid from it is folded in below)

---

## 0. How we're working on this

This is a **collaborative working document**, not a verdict. A few norms we've settled into:

- **Nobody is defending a position.** Options get retired because we learned something, not because someone
  lost. Every retired option contributed the insight that retired it — that's recorded, because it's the useful part.
- **Adversarial review is a tool, not the goal.** We deliberately ran hostile review rounds to stress the
  reasoning. That's a technique for finding blind spots, not a scoreboard.
- **Claims are labeled.** **Fact** (verified in code, path given) · **Inference** · **Assumption** ·
  **Opinion**. We got burned once by an inference presented as a fact (§3, Q1) — hence the discipline.
- **Unverified means unverified.** If something is load-bearing and unconfirmed, it goes in §3 (Open Questions),
  not §2 (Settled) — however confident it feels.
- **The irreversible parts wait for evidence.** Additive changes can move ahead of certainty; deletions can't.

**Everyone reading this is invited to break it.** If a "settled" item in §2 is wrong, that's the most valuable
contribution available.

---

## 1. Where we are now

**Current best thinking: Option E — task-oriented column width commands.** _(§4, §5 Round 3)_

Width becomes a set of **named commands on a column** — _Fit to content · Wider · Narrower · Reset · Custom…_ —
living in the header actions menu where **pin and sort already live**. The drag stays as a **pointer
accelerator**, not a tab stop, not a bespoke ARIA widget.

**Governing principle we arrived at:**

> **Direct manipulation is an accelerator for a task that is independently reachable by name.**

The principle's main credential is that it's **not invented for this decision** — column order, pinning,
sorting, and visibility already follow it, and none of them ever produced a review round. Width is the sole
deviation. _(§2.6)_

**Confidence:** Medium-High on the principle and diagnosis · **Medium** on autofit semantics under
virtualization _(§3, Q4)_.

**Staging** — **revised in Round 4** (see §2.9; the roadmap reordered this):

| Step  | Change                                                                                                      | Gated on                                                                      |
| ----- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **0** | **Design the navigation model** (`role="grid"` + roving tabindex, focus-by-coordinates)                     | **Nothing — this is now the spine.** Required by row selection, not by resize |
| **1** | Add _Fit to content_ + _Reset_ commands; un-break the bounds fallback so presets work for unbounded columns | Nothing — closes a live gap, purely additive, navigation-independent          |
| **2** | Add _Wider / Narrower_; _Custom…_ as escape hatch                                                           | Step 1 landing                                                                |
| **3** | ~~De-focus the splitter~~ — **possibly moot**                                                               | **Under D the grid absorbs the tab stop.** Do not act before step 0 lands     |

---

## 1.1 The three-layer architecture _(Round 4)_

The roadmap made the layering visible in a way resize alone never could:

| Layer              | Owns                                                     | Roadmap items that need it                            |
| ------------------ | -------------------------------------------------------- | ----------------------------------------------------- |
| **Task** (E)       | Named commands; modality-independent; the canonical path | grouping, nested headers, selection                   |
| **Navigation** (D) | `role="grid"` + roving tabindex; focus by coordinates    | **row selection (forcing)**, nested headers, grouping |
| **Accelerator**    | drag, splitter — optional, pointer-first                 | resize                                                |

**E and D are orthogonal and both needed.** E = _what can you do_. D = _how do you reach it_. The splitter is an
accelerator that can live **inside** D without costing a global tab stop.

---

## 2. Settled — high confidence, evidence-backed

### 2.1 The Sonar triage is closed

Five findings. **One real, fixed. Four misfires.**

| #   | Finding                                   | Location                                             | Outcome                                                                                                                                                                                                                                                     |
| --- | ----------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Prefer top-level await over promise chain | `packages/repo-standards/scripts/merge-coverage.mjs` | **Fixed.** Both branches re-verified: success merges 1,396 files; forced failure prints and exits 1.                                                                                                                                                        |
| 2   | Non-interactive element has listeners     | `ResizeHandle.component.tsx:27`                      | Won't Fix — see 2.2                                                                                                                                                                                                                                         |
| 3   | Use `<hr>` instead of `"separator"`       | `ResizeHandle.component.tsx:27`                      | Won't Fix — see 2.2                                                                                                                                                                                                                                         |
| 4   | `tabIndex` only on interactive elements   | `ResizeHandle.component.tsx:38`                      | Won't Fix — see 2.2                                                                                                                                                                                                                                         |
| 5   | Remove use of `void`                      | `usePersistTableStateAction.hook.ts:84`              | Won't Fix — `fetcher.submit` returns `Promise<void>` (verified, `react-router/dist/development/lib/dom/lib.d.ts:1658`); enclosing callback is sync and returns `boolean`, so it cannot await. `void` is the typescript-eslint `no-floating-promises` idiom. |

> ⚠️ **Note:** if we adopt Option E, findings #2–#4 **disappear on their own** — the bespoke `role="separator"`
> widget stops existing. Don't spend effort on Sonar annotations before the design lands.

### 2.2 Why #2–#4 are misfires — one root cause _(Fact)_

```js
// aria-query@5.3.0 · lib/etc/roles/literal/separatorRole.js
superClass: [['roletype', 'structure']];
```

`aria-query` — the role database both jsx-a11y and Sonar's React a11y rules build on — models `separator` as
structure-only. ARIA 1.2 makes it a **widget when focusable**. The database flattens that conditional, so every
rule downstream misfires on a focusable splitter.

**Won't Fix text:** _"Focusable `role="separator"` is an ARIA 1.2 widget (APG Window Splitter); aria-query models
separator as structure-only, producing a false positive."_

> **Caveat:** our Oxlint `jsx-a11y` pass is clean here, but that's **weak** evidence — Oxlint's a11y rule coverage
> is partial. The load-bearing evidence is the spec + the `aria-query` source above.

### 2.3 The drawer is a staged, commit-on-Accept surface _(Fact)_

From `ColumnSettingsDrawerFooter.component.tsx`'s own docblock:

> _"Accept commits all drawer-local column state to the table and keeps the drawer open; Cancel discards pending
> changes and closes unless pinned."_

Drawer-local store → **Accept** → `useBatchSetColumnDrawerSettings` batch-commits to the table.

**Why it matters:** width is **continuous and perceptual** — the target state is _"looks right"_, which only
exists on screen. A staged surface gives type → Accept → look → reopen → adjust. This is what retired **B′**
(§5, Round 3).

### 2.4 Resize is a set-once operation _(Fact → strong Inference)_

**Fact:** column width persists to a **cookie**, read back by the SSR loader to seed the store.
**Inference:** therefore resize frequency → ~zero after initial setup. A user fixes a truncated column once; it
survives reloads and sessions.

**Why it matters:** optimizing resize for _throughput_ (a per-column tab stop giving single-keystroke access) is
the wrong axis. The right axis is **discoverability and reachability**. This also dissolves the "multi-step is
slower for power users" objection — slower doesn't matter for an operation done once.

### 2.5 The APG Window Splitter analogy is superficial _(Inference, well-supported)_

A window splitter **reallocates space between two panes** — zero-sum, both sides content, `aria-controls` names
the pane. Column resize is **not zero-sum**: widening column 3 doesn't shrink column 4; it widens the table or
extends the scroll region. There is no second pane.

**The tell:** `aria-controls` is **absent** from `ResizeHandle`. Earlier rounds logged this as a minor gap.
We now read it as a **symptom that the pattern doesn't fit** — there's nothing coherent to point at. A column is
not a pane. The pattern was adopted by _visual_ analogy (a thin draggable line looks like a splitter), not
semantic analogy.

### 2.6 The Table already follows the principle — width is the outlier _(Fact)_

| Column task | Home                          | Direct-manipulation accelerator? |
| ----------- | ----------------------------- | -------------------------------- |
| Order       | `ColumnOrderSection` (drawer) | —                                |
| Pinning     | Header actions menu           | —                                |
| Sorting     | Header actions menu           | —                                |
| Filters     | Drawer / filter UI            | —                                |
| Visibility  | Drawer                        | —                                |
| **Width**   | **Bespoke header splitter**   | **drag**                         |

Column **reorder** — spatially continuous, the closest analogue to width — lives in a drawer and **has never had
this discussion**. That's the architecture telling us something.

### 2.7 There is no keyboard navigation model at all _(Fact)_

- Zero hits for `role='grid'` / `role='row'` / `role='gridcell'` across the Table. It's a plain `<table>`.
- `ResizeHandle`'s `tabIndex={0}` is the **only `tabIndex={0}` in the entire Table** (`TableCheckDisplay` uses `-1`).
- No roving tabindex, no arrow-key navigation, no focus model.
- **Header is not virtualized; rows are.**
- `isResizable` defaults **true** (`column.isResizable !== false && !column.isStatic`), so most columns carry a handle.

**Reframe this produced:** the splitter's tab stop is a **symptom**, not the disease. Every future header widget
re-litigates the same question until there's a model.

### 2.8 The task was never modeled _(Inference, high confidence)_

Decomposing what users actually want:

| Task                                   | Exposed by splitter?    | Exposed by drawer?      |
| -------------------------------------- | ----------------------- | ----------------------- |
| **Fit to content** _(dominant intent)_ | ❌                      | ❌                      |
| Wider / narrower                       | ✅ arrows               | ⚠️ min/max presets only |
| Exact width                            | ❌                      | ❌                      |
| Reset                                  | ✅ Enter / double-click | ✅ Default              |

**The highest-value task is exposed nowhere, by any path, for any input modality.** The component implemented a
_mechanism_ (draggable boundary), mirrored it to the keyboard, and never modeled the task. Double-click
**resets** (`setColumnSizing({ columnKey, width: undefined })`) — it does not autofit.

### 2.9 The roadmap reorders everything _(Round 4 — Lucio)_

**Built:** column reorder · pinning · column hiding
**Coming (to design):** grouping · nested headers
**Later:** row selection · dynamic row height (currently fixed)

Five consequences, in order of impact:

**(a) Q3 is answered.** Grouping + nested headers + row selection = **enterprise data grid**, definitively. Not a
CRUD viewer. This was our top open question; product direction closed it, not inference.

**(b) Row selection forces the navigation model — and resize isn't what forces it.** _(Fact + Inference)_
`TableCheckDisplay` today is a **read-only, disabled, `tabIndex={-1}`** checkbox — it _displays_ a boolean cell
value. Real selection is greenfield. When it lands: a **focusable checkbox per row inside a virtualized body**.
Tab to it, scroll, the row unmounts, **focus is destroyed**. That's a **bug, not a preference** — selection over
virtualization is unshippable without focus management. ⇒ **D is mandatory**, driven by selection.

**(c) This partly rescues the splitter — against our own Round 3 direction.** Under D the whole grid is **one tab
stop**; the splitter's tab-order cost is **absorbed by the navigation layer**. So **step 3 (de-focusing) may be
unnecessary entirely**, and **Q2 may never need answering**. The splitter can survive as an accelerator inside D,
keeping its real virtues (live, self-announcing, continuous). **We don't have to delete anything.**

**(d) Nested headers are the strongest evidence yet for task-naming.** _(Inference)_
Resizing a **parent** header is semantically ambiguous in a way a leaf column never was: a group's width is
**derived** from its children, so `aria-valuenow` on a group splitter is a number you can't directly set; and
dragging a parent boundary has no single meaning (children scale proportionally? last child absorbs? push
siblings?). **The drag has no single meaning, so there is nothing coherent to mirror to the keyboard.** Named
commands survive at any depth: _"Fit group to content"_, _"Distribute evenly"_.
⇒ **Mechanism-mirroring degrades as structure gets richer; task-naming scales.** This generalizes §2.8.

**(e) Dynamic row height cuts both ways — see Q4.** It weakens our keystone. Recorded honestly there.

### 2.10 Naming collision — act before it's public API _(Fact)_ — ✅ **LANDED** (commit `15b92340`)

**Done:** renamed to `PinnedColumnPartitionState` / `useGetPinnedColumnPartition`. The name `ColumnGroup*` is now
free for real grouping to claim.

`ColumnGroupsState` **used to exist** and meant the **pinning partition**, not semantic column grouping:

```ts
export type ColumnGroupsState<TData> = {
  readonly centerCols: readonly TableColumn<TData>[];
  readonly leftPinnedCols: readonly TableColumn<TData>[];
  readonly rightPinnedCols: readonly TableColumn<TData>[];
};
```

When grouping / nested headers land, this name is taken. `packages/ui` is **going public** ⇒ renaming later is a
**breaking change**; renaming now is free. Suggest `PinnedColumnPartition` or similar. **Independent of this
decision — worth doing regardless.**

### 2.11 Non-negotiables: performance + zero layout shift _(Round 4 — Lucio)_

**These are constraints, not preferences.** Every option is subject to them.

**The no-layout-shift guarantee already exists — it's why the cookie exists.** _(Fact)_
From `usePersistTableStateAction.hook.ts`'s docblock:

> _"The cookie is the single source of truth because it is the only channel the SSR loader can read... **A
> client-only copy could only contradict that markup and shift it at hydration.**"_

Width → cookie → SSR loader seeds the store → **the server paints the correct width** → no hydration shift.
(This is what the `Prefer cookie over session storage` and `first paint fix` commits were doing. sessionStorage is
client-only ⇒ server renders defaults ⇒ client corrects ⇒ guaranteed shift.)

⇒ **Hard constraint: any width mechanism must be SSR-expressible and round-trip through the cookie.**

- Menu commands (E): ✅ same `useSetColumnSizing` → same persist path.
- Autofit: ✅ **with a caveat** — it measures client-side, so the _first_ autofit necessarily shifts. That's
  user-initiated (CLS-exempt) and the measured px then persists, so every subsequent load is stable.

### 2.12 🔴 Dynamic row height collides with the drag preview _(Fact — verified)_

`useColumnDragSession` is **RAF-throttled and writes to the store every frame** via
`useSetColumnSizingWithoutSync`, persisting once at mouse-up. Its docblock states the intent: _"frames go through
`useSetColumnSizingWithoutSync` (store only, so a drag does not rewrite the cookie at 60fps)."_

- **Today: cheap.** Only column widths reflow — `rowHeight` is a **32px scalar**.
- **Under dynamic row height: not.** Wrapping content ⇒ every frame re-wraps and re-measures **every visible row**
  (60fps × ~30 rows × measure). Jank, **plus continuous layout shift during the drag** — a direct violation of §2.11.

**Fix (well-trodden): ghost-line drag** — render a drag indicator, apply the width once on release. Zero per-frame
reflow, zero shift during drag, resize becomes a single discrete commit.

⚠️ **This is an argument about _the drag_, not about E vs A.** But it means the **current drag architecture is on a
collision course with the roadmap**, independent of this decision. Worth acting on while `useColumnDragSession` is
small and isolated.

### 2.13 The grouping model, unpacked _(Round 4 — Lucio)_

Grouping = columns pinned together · expand/collapse · **label shown once for all children**.

1. **"Label once over children" ⇒ `colSpan` on the group header ⇒ a genuinely 2D header.** Plain `<table>` colSpan
   handles _display_; it does **not** give _navigation_. That needs `aria-colindex` / `aria-colspan` — the grid model.
2. **Expand/collapse = another interactive control per group.** Tab-stop math: 3 groups × 5 columns =
   **3 toggles + 15 splitters + 15 menus = 33 header tab stops** before reaching a row. ⇒ **Q2 stops being
   theoretical the moment grouping ships.**
3. **"Columns will be pinned" = a constraint on reorder** (already shipped): children stay contiguous, groups move
   as units, a group pins as a whole.
4. **Sharpens the nested-header resize ambiguity (§2.9d):** a collapsed group's width derives from its
   _currently visible_ children ⇒ a group splitter's `aria-valuenow` would **change meaning on expand/collapse**.

### 2.14 The store/context architecture is a constraint too _(Round 4 — Lucio)_

Split contexts · **actions + selectors** · **no prop drilling** · granular `useSyncExternalStore` subscriptions.
This is CLAUDE.md non-negotiable #5 and the `store-pattern` skill. Three consequences for this decision:

**(a) It makes E's task layer natural.** **Named commands _are_ action hooks** — literally the existing pattern.
`useAutofitColumn()`, `useSetColumnWidth()`, `useDistributeGroupEvenly()` as actions; menu items as
**self-connected delegates** taking `columnKey` and nothing else. By contrast `useColumnResize` is a **mechanism
hook**: it bundles pointer + keyboard + bounds under a name describing an _interaction_, not a task. The
task/mechanism split (§2.8) shows up in the hook layer, not just the UI.

**(b) Step 0 wants its own context — and that fits.** Focus state (coordinates or activedescendant id) is shared
state consumed by many cells ⇒ context + store + selectors + actions, alongside `TableConfig` / `TableData` /
`FiltersData` / `TableWrapper`. Granular subscription is what makes it viable: each cell subscribes to a
**boolean** (`isFocused(coords)`), not the focus object. **The navigation model isn't a foreign body — the
architecture already has the shape for it.**

**(c) It corrects our Q6 perf claim — see Q6.**

### 2.15 Verified perf bug: the drilling and the re-render storm are one defect _(Fact)_ — ✅ **LANDED & CONFIRMED** (commits `8f6c3d3c`, `7a063440`)

**Hypothesis was confirmed empirically before the fix** (a subscription test now guards it): every `TableHeaderCell`
re-rendered on any single column's width change. **Fixed:** added the granular `useGetColumnWidth(columnKey)`
selector (returns a **number** ⇒ `Object.is` short-circuits), and `ResizeHandle` now **self-connects** with
`columnKey` + `columnLabel` only. A drag now re-renders **one** header cell per frame, not N. A parallel
pinning-info drill was fixed the same way. Original write-up kept below for the record.

`TableHeaderCell` **used to** read store state and drill it into `ResizeHandle`:

```tsx
const columnSizing = useGetColumnSizing<TData>(); // ← the WHOLE map
const column = useGetNormalizedColumn<TData>(columnKey);
const currentWidth = columnSizing[column.key] ?? effectiveMinWidth;

<ResizeHandle
  columnKey={columnKey}
  currentWidth={currentWidth}
  maxWidth={maxWidth}
  minWidth={effectiveMinWidth}
/>;
```

**Fact:** `useGetColumnSizing` returns `state.columnSizing` — an **object reference**. `useColumnsStore` is
`useSyncExternalStore`, which compares snapshots with `Object.is`. An immutable width update creates a new
`columnSizing` object ⇒ **every `TableHeaderCell` re-renders when any single column's width changes.**

⇒ **During a drag: 60fps × N header cells.** RAF throttling bounds it to one write per frame, but each frame still
re-renders _every_ header cell. **Direct violation of §2.11** — and exactly what granular subscriptions exist to
prevent.

**The prop drilling _causes_ the perf bug.** Drilling forces the parent to subscribe coarsely. Per the repo's own
rule (thin shell + self-connected delegates), `ResizeHandle` should take `columnKey` + `columnLabel` and
self-connect. Move the subscription to the leaf + add the missing one-liner selector:

```ts
export const useGetColumnWidth = <TData>(columnKey: DataKey<TData>) =>
  useColumnsStore<number | undefined, TData>(
    (state) => state.columnSizing[columnKey],
  );
```

A **number** ⇒ `Object.is(120, 120)` ⇒ unaffected cells don't re-render. **The granular pattern already exists
next door** — `useGetNormalizedColumn(columnKey)` does precisely this. There is just no width equivalent.

⚠️ **Independent of E vs A. Verified, cheap, and worth fixing on its own.** It also compounds §2.12: under dynamic
row height you'd re-render every header cell **and** re-measure every visible row, per frame.

---

## 3. Open questions — what we still need

These gate the decision. **Help wanted on all of them.**

### Q1 — Is the WCAG 2.5.7 reading correct? 🔴 _Load-bearing, unconfirmed_

**Claim:** 2.5.7 _Dragging Movements_ (AA) requires a **single-pointer, non-drag** alternative, and a **keyboard**
alternative does **not** satisfy it — the SC targets people who use a pointing device but cannot drag (head
pointer, eye tracking, tremor). Keyboard access is 2.1.1's job.

**If true:** there's a **live AA failure today** for unbounded columns (see 3.1), and _no keyboard-shaped option
fixes it_ — not A, not C, not D.

**Status:** asserted by one reviewer, **not independently confirmed**. This is the single most important thing to
verify, because it's what makes Option E's step 1 urgent rather than optional.

**Sub-questions:** Does 2.5.7 even apply, or is dragging "essential" here? Do three presets constitute
"achieving the functionality"? Does 2.5.7 demand _equivalent granularity_? Is "you can reset but not resize" a
pass or a fail?

**Who can settle it:** whoever owns the VPAT / an a11y specialist.

#### 3.1 The gap Q1 would confirm _(Fact chain — the code is verified; only the SC reading is open)_

- `getNormalizedColumns.util.ts` contains **no `minWidth`/`maxWidth` handling** — normalization does **not**
  backfill bounds. So an unconfigured column has `column.minWidth === undefined`.
- `GeneralSectionHeader.component.tsx:48-49, 57-58`: `hasMinWidth = column.minWidth !== undefined` →
  `isMinDisabled={!hasMinWidth}` (same for max).
- `ColumnWidthPresetButtonsProps` has **no `isDefaultDisabled`** — Default is always enabled.
- `resolvePresetColumnWidth('default')` → `return;` → **clears** sizing.

⇒ **For a column with no configured bounds, a pointer user can _reset_ it but cannot _resize_ it without dragging.**

> **Asymmetry worth noting:** `ResizeHandle` receives `minWidth={effectiveMinWidth}` where
> `effectiveMinWidth = minWidth ?? DEFAULT_MIN_COLUMN_WIDTH` — the _splitter_ always has usable bounds. The
> _drawer_ reads the raw un-defaulted `column.minWidth`. **The two paths disagree.** This looks like a plain bug
> independent of the design question, and fixing it may be worth doing on its own.

### Q2 — Is the tab-order cost material? 🟢 _No longer theoretical — grouping settles it_

**Fact:** each resizable column contributes 2 header tab stops (splitter + menu trigger); `isResizable` defaults true.
**Was:** an unmeasured inference ("15 columns = 15 extra tab stops").

**Round 4 resolves this from both ends:**

- **Grouping makes it concrete (§2.13.2):** 3 groups × 5 columns = **33 header tab stops** before a row. No
  measurement needed — the roadmap creates the cost.
- **But D absorbs it (§2.9c):** under a grid the whole table is one tab stop.

⇒ **The question was never "is the cost real" — it's "does the navigation model absorb it."** It does. **Do not
spend effort measuring column counts.** This no longer gates anything; step 0 handles it.

### Q6 — Roving tabindex vs `aria-activedescendant`? 🔴 _Now the most consequential technical fork_

Step 0 (the navigation model) is the spine that row selection, grouping, and nested headers all ride on. How focus
is modelled is its central decision.

|                                | Roving tabindex                                         | `aria-activedescendant`                                                         |
| ------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Focus survives row unmount** | ❌ destroyed → reconstructive restore, racy with scroll | ✅ focus never leaves the container                                             |
| **Cost per arrow key**         | 2 cell re-renders (`tabIndex` changes on both)          | 1 container attribute — **settable imperatively via ref, zero React re-render** |

**⚠️ Correction (§2.14c) — we overstated the perf half of this.** We first argued activedescendant wins on render
cost too. **The store architecture largely dissolves that argument:** with granular subscriptions each cell
subscribes to `isFocused(coords)` → a **boolean** → only the **two** affected cells re-render. Two re-renders is
trivially cheap. ⇒ **The perf axis is roughly a wash.**

**What survives:** activedescendant's real advantage is the one that always mattered — **focus survival when a
virtualized row unmounts**. We still think that's decisive, but the case is narrower than we first stated it.

**Open:** Is the focus-survival reading correct? Real-world AT support (JAWS/NVDA/VoiceOver) at this scale? Does it
interact badly with **nested headers** (2D navigation over a `colSpan` hierarchy, §2.13.1)?

### Q3 — What is this table? ✅ _ANSWERED in Round 4 — enterprise data grid_

The roadmap settles it (§2.9a): grouping + nested headers + row selection is an **enterprise data grid**, not a
CRUD viewer. Product direction, not inference.

**Consequence:** `role="grid"` is table stakes, and **D is a requirement** — but driven by **row selection**, not
by resize (§2.9b). E stays correct underneath it. The old "E is invariant across three product types" argument is
now retired as unnecessary — we know which one it is.

### Q4 — Autofit semantics under virtualization? 🔴 _Got harder in Round 4 — now our weakest point_

Rows are virtualized, so we can only measure **rendered** cells. "Fit to content" is really "fit to the ~30 rows
in the DOM," and it changes answer with scroll position — the same command twice gives two widths. Also
client-only measurement in an **SSR** app with cookie-persisted width → hydration story.

Every real grid ships "fit to _visible_ content" (measuring unrendered rows is impossible under virtualization by
definition). **Our position:** acceptable, but must be named honestly and accepted as a product decision, not hidden.

**🔴 Round 4 — dynamic row height makes this worse.** _(Fact + Inference)_
**Fact:** `rowHeight` is a **single scalar** in meta state (`DEFAULT_ROW_HEIGHT = 32`), consumed by
virtualization. Dynamic height ⇒ per-row measurement + cache + invalidation.

1. **Autofit becomes ill-defined for wrapping columns.** With wrapping content a narrower column doesn't
   truncate — it makes rows **taller**. "Fit to content" has no unique answer; it's a **width/height tradeoff
   needing a policy**. ⇒ autofit is likely a **per-column policy** (well-defined for non-wrapping columns, which
   is most of them), **not a universal command**.
2. **A new resize ↔ virtualization coupling appears.** Changing a column's width **invalidates every measured row
   height** → re-measure → scroll jump. Resize stops being a cheap visual operation. _True regardless of which
   affordance triggers it_ — not an argument for or against E.

**Why this threatens the proposal:** Option E's argument leans on autofit being the **dominant** task (§2.8).
If autofit can't be done well here, **does E collapse?** Current read: E's _principle_ strengthens (§2.9d) while
E's _keystone task_ weakens. Both are true, and we do **not** consider this resolved.

**Open:** Is scroll-dependent width acceptable, or a correctness problem? What do we name the command so the
behavior isn't a lie? Is per-column autofit policy the right model? Sample-based measurement? Server-side hints?

### Q5 — Two hooks named `useSetColumnSizing` ✅ _RESOLVED_ (commit `154e5caa`)

The drawer action is now `useSetDraftColumnSizing` — the staged-vs-live distinction is visible at the call site,
so the trap that caused the B′ mistake is guardrailed. The live `contexts/TableConfig/.../useSetColumnSizing`
keeps its name. (Sibling drawer actions — pinning/filter/sorting — carry the same latent ambiguity; reported, not
renamed, pending a decision on whether to normalise the whole `useSetDraft*` family.)

---

## 4. Options — living table

| Option | Description                                                | Status                   | Why                                                                                                                                                                                                                                                                                          |
| ------ | ---------------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A**  | Keep as-is; splitter stays focusable                       | 🟡 Partially alive       | Best property: near-zero coupling, and it's built, live, self-announcing, tested. Doesn't fix Q1's gap. Its real contribution: **"don't rush the deletion"** — which we accepted (step 3 is gated).                                                                                          |
| **B**  | Mouse-only handle; drawer as keyboard path                 | 🔴 Retired               | Presets are named but incomplete (no fit-to-content) and disabled exactly when needed (3.1).                                                                                                                                                                                                 |
| **B′** | B + arbitrary-width spinbutton in the drawer               | 🔴 Retired               | **Retired by 2.3.** A spinbutton is a _mechanism_ (type a number), not a _task_, parked in a **staged** surface — a broken feedback loop for a live perceptual property. Its contribution: forced us to check the drawer's commit model, which is what exposed the task/mechanism confusion. |
| **C**  | Keyboard resize via modifier chord on the menu trigger     | 🔴 Retired               | Chord is undiscoverable and unannounced; couples resize _mechanism_ into the menu's keydown; doesn't scale (next feature chords onto the same button); regresses AT UX vs. the self-announcing splitter; doesn't fix Q1.                                                                     |
| **D**  | `role="grid"` + roving tabindex                            | 🟢 Alive, **orthogonal** | Governs **navigation**, not tasks. Legitimate target once grouping / nested headers arrive. **Not a resize decision** — see Q3.                                                                                                                                                              |
| **E**  | **Task-oriented column width commands in the header menu** | 🟢 **Current proposal**  | Satisfies the principle by construction. See §1.                                                                                                                                                                                                                                             |
| **✗**  | Drop `tabIndex`, no replacement                            | 🔴 Retired               | Non-compliant, and doesn't even silence the findings it targets — mouse handlers keep #2–#3 firing.                                                                                                                                                                                          |

**E is not C.** C was a _modifier chord on a button_ — mechanism coupling, invisible. E is _named menu items in a
menu that already holds column commands_ — cohesion, visible, announced. That distinction is the whole principle.

### What Option E buys, by construction

Q1's gap (commands are clicks; _Fit to content_ needs no configured bounds — the exact broken case) ·
2.1.1 (menu is already keyboard-reachable, standard `menuitem` semantics, no chord) · zero new tab stops ·
**RTL** (named commands are direction-agnostic; `ArrowRight → wider` is not) · touch · mobile ·
and the Sonar findings #2–#4 vanish as a side effect.

---

## 5. How our thinking evolved

Each round contributed the insight that moved the next one. Recorded because the _path_ is the useful part —
and because it shows which questions were productive.

**Round 0 — Sonar triage.** Established the aria-query root cause (2.2) and fixed the one real finding. Framed
everything as "which findings are real?" **Contributed:** closed the tool question, surfaced that there was a
design question underneath.

**Round 1 — _"Why does it need to be focusable? I don't see the benefit."_** (Lucio)
The question that cracked it open. Forced a look for an _alternative path_, which found the drawer presets — and
their disabled-when-unbounded bug (3.1). **Contributed:** proved the question wasn't about Sonar at all. Also
corrected an overstatement ("removing tabIndex is a flat 2.1.1 failure" → it's specific to unbounded columns).

**Round 2 — adversarial ADR review.** Reframed from _element_ to _architecture_ (2.7): the tab stop is a symptom.
Surfaced the 2.5.7/2.1.1 conflation (Q1) and the resulting live gap. Retired C. Proposed B′.
**Contributed:** the reframe, and the realization that every option so far was keyboard-shaped while the gap has
a _pointer_ axis.

**Round 3 — _"Attack the foundations. Ignore A/B/C/D/B′."_** (Lucio)
The instruction that produced Option E. Verified the drawer's staging model (2.3), which retired B′. Found the
APG mismatch (2.5) and the set-once fact (2.4). **Contributed:** the recognition that **all five options were
placements of a drag-mirror** — the space had no axis for _"model the task instead."_

**The thread through all of it:** three rounds each refined the _placement_ of an abstraction that shouldn't have
existed. The productive move each time was a **reframe**, not a better answer to the existing question.

---

## 6. Next steps

| #   | Action                                                                                   | Owner             | Blocks                     |
| --- | ---------------------------------------------------------------------------------------- | ----------------- | -------------------------- |
| 1   | **Independent read on Q1** (2.5.7 interpretation)                                        | a11y / VPAT owner | Urgency of step 1          |
| 2   | **Answer Q3** (what is this table?)                                                      | Product / Lucio   | Whether D is ever in scope |
| 3   | **Measure Q2** (column counts, resize usage)                                             | —                 | Step 3 (de-focusing)       |
| 4   | **Fix the bounds-fallback asymmetry** (3.1) — likely a plain bug, worth doing standalone | —                 | Nothing                    |
| 5   | **Rename one of the two `useSetColumnSizing` hooks** (Q5)                                | —                 | Nothing                    |
| 6   | Decide Q4 (autofit naming + scroll-dependence)                                           | —                 | Step 1                     |
| 7   | Promote to an ADR once a direction lands                                                 | —                 | The above                  |

**Not blocked:** items 4 and 5 are independent improvements we're confident about.

---

## 7. For anyone joining

- **Read §2 first** (what's settled) then **§3** (what's open). §5 is optional context.
- **The highest-value contribution is breaking a §2 item** or settling **Q1**.
- **Don't act on the retired options** without reading why they were retired — each was retired for a specific,
  recorded reason, and if that reason is wrong the option comes back.
- **Nothing here is implemented.** The only code change so far is the `merge-coverage.mjs` fix (2.1, finding #1),
  which is unrelated to this decision.
