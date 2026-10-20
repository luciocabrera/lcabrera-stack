# react-doctor triage record

React Doctor is **enforced**, as of [ADR-055](../decisions/ADR-055-react-doctor-as-a-gate.md):
`vp run react-doctor:verify` runs in `check:push` and in `check-safe.yml`, the tool is
pinned at `catalog:lint`, and `doctor.config.jsonc` at the root holds its config. It is
still not one of the three linters in [AGENTS.md](../../AGENTS.md) §4 — it is a separate
CLI with its own config and report.

**The configured level decides what blocks.** The gate reads `blocking` from
`doctor.config.jsonc` itself (ADR-055, amended 2026-10-19). An accepted finding below at
or above that level cannot simply stay in the report: it has to be fixed, or carried by
an argued config entry. This file is the record of what has already been argued, so the next
agent spends one read instead of re-deriving the same judgements. Current findings are
visible via `vp run react-doctor:report`.

> **Two claims in the previous version of this file were wrong**, and both are corrected
> above. It said React Doctor "documents **no suppression mechanism** — no config entry
> for a single site, no inline comment": it documents both — `ignore.overrides` in the
> config and `react-doctor-disable{,-line,-next-line}` comments. It also said nothing in
> CI runs it and it is not a dev dependency, which ADR-055 changed. Neither was true when
> re-checked against v0.9.1.

**A suppression is not a triage row.** Because those mechanisms exist, they are now
policed: `suppressions:verify` detects every one of them, and inside the public
packages (`vp run suppressions:packages`) each needs an argued entry in
[`public-package-suppressions.json`](public-package-suppressions.json). Non-Negotiable
Rule 11 applies unchanged — prefer fixing the code, and record an accepted finding here
rather than silencing it.

How the gate is wired, what it blocks and which rules are off is
[ADR-055](../decisions/ADR-055-react-doctor-as-a-gate.md). Read that before wiring the
tool into anything; this file stays the authority on per-finding reasoning.

The chained-iteration verdicts this file used to carry were dropped once React Doctor
began shipping that rule disabled by default; `doctor.config.jsonc` pins it off so a
future default change cannot reopen them under the warning gate.
[`react-doctor-triage-measured.md`](react-doctor-triage-measured.md) keeps the
measurements behind them; read it before enabling the rule again.

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
   [ADR-007](../decisions/ADR-007-barrel-export-boundaries.md)
   _requires_ importing through a curated barrel across a module boundary. Rewriting
   those imports to direct paths would invert the repo's own decision.

**What is still worth doing, separately.** ADR-007 rule 1 says that _inside_ a module,
imports should be direct-file — so an intra-module barrel hop (a file importing `./utils`
from within the same folder) is worth tidying for **cycle risk and import direction**,
which is ADR-007's actual concern. That is a small subset, it is not a bundle-size
matter, and React Doctor cannot identify it: the rule does not model module boundaries.

## Rule: `react-doctor/js-set-map-lookups` — promoted to `error`

**What it flags.** `array.includes()` evaluated inside a loop or an iteration
callback, so the membership test rescans the whole list per element. Category
Performance, originally severity warning.

**Verdict: fixed everywhere and promoted to `error`** in `doctor.config.jsonc`
(#460 for the shared table/list utils, #462 for `ColumnOrderSection`). Nothing is
accepted under this rule. A membership scan inside a loop is quadratic whatever
the constant factor, and every fix was a local `new Set(...)` that left the
surrounding expression declarative, which removed a real asymptotic term.

**Promotion keeps it blocking at any level.** It was promoted so that none of these
could come back with the gate still exiting 0, and the `error` entry holds that whatever
`blocking` names, because this family is one React Doctor is reliably right about.

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

## Rule: `react-doctor/js-hoist-intl` — fixed, by naming the formatter's inputs

[`getCurrencySymbol.util.ts`](../../packages/ui/src/components/Form/fields/CurrencyField/utils/getCurrencySymbol.util.ts)
no longer reports. An earlier version of this section said it had to, and that was
wrong.

The rule fires on `new Intl.X(…)` lexically inside a function body, with a set of
exits read from its source (`oxlint-plugin-react-doctor`, the `js-hoist-intl`
definition) rather than its documentation: module scope, a `useMemo`/`useCallback`/
`useRef` callback, a value passed straight to a cache's `.set()` or assigned with
`??=`, and **a non-component function whose constructor arguments are its own
parameters** — a formatter built from what the caller passes cannot be hoisted. The
previous shape missed that last exit only because the constructor read
`resolvedCurrency`, a local the rule cannot trace back to a parameter, and a locale
from a call. Moving the construction into a private `readCurrencySymbol({ currency,
locale })` passes both as parameters and satisfies it without changing what is
built or how often.

Neither `useMemo` nor module scope was available: the currency varies per call, and
ADR-004 (React Compiler owns memoization) means `packages/ui` contains no `useMemo`
at all. The `useMemo` form would also be _worse_: it memoizes per component
instance, so every `CurrencyField` mount rebuilds the formatter anyway.

**The cost the rule is pointing at was real and large, and is still paid once per key.**
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

| Rule                               | Site                                 | What was wrong                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rendering-svg-precision`          | `EraserIcon`, `RefreshIcon`          | Figma-export coordinates carrying 4–5 decimals in a `0 0 16 16` viewBox. Rounded to 2. **Fix every offending line in the file, not the reported one** — the rule reports once per file, so `RefreshIcon`'s remaining two paths would simply have taken the flagged line's place. Shared endpoints were rounded consistently so the arrowheads still meet the arcs.                                                                                                    |
| `prefer-module-scope-static-value` | `SettingsTabs`, `VirtualListFooter`  | `tabs` / `modes` rebuilt per render with no local-state input. Hoisted. In `VirtualListFooter` only `modes` moves — the sibling `modeConfig` reads live counts and must stay.                                                                                                                                                                                                                                                                                         |
| `no-unknown-property`              | `TooltipTrigger`                     | `popoverTarget` on a `<span>`. React does render the attribute (the rule's "React ignores it" wording is loose) but only `button`/`input` can be popover invokers, so it was inert — `Tooltip` drives the popover with `showPopover()`/`hidePopover()` on a ref. Removed, and a test now asserts its absence.                                                                                                                                                         |
| `no-pass-live-state-to-parent`     | `useVirtualSelectDropdown`           | `onOpenChange` fired from a `useEffect`, so the parent rendered once with the stale value and got a spurious `false` on mount. Now called from the two handlers that change the state. Safe because every consumer initialises its own mirror to `false`, so the mount call was already a no-op.                                                                                                                                                                      |
| `async-await-in-loop`              | `apps/showcase/scripts/seed-db.mjs`  | The seed sources ran through `reduce(async (previous, …) => { await previous; … })`. Sequential, but only because each callback awaited the last one's promise. Now a recursive `applyInOrder` that awaits one source and then recurses on the rest, which is sequential by construction: each source still applies after the one before it, and a rejection still stops the run. Not a `.then` chain, which trades this finding for eslint's `unicorn/prefer-await`. |
| `zod-v4-no-deprecated-schema-apis` | `SkillScores.cellRenderers.test.tsx` | `z.object(…).strict()` → `z.strictObject(…)`.                                                                                                                                                                                                                                                                                                                                                                                                                         |

## Rule: `react-doctor/no-redundant-roles` — false positive, overridden per file

`role="rowgroup"` on the populated `<tbody>` (`TableBody.component.tsx`) and
`role="row"` on every `<tr>` (`TableRow.component.tsx`). Both elements lose their
implicit table role to their own stylesheet's `display`, so the attribute is the only
source of the row ownership `role="grid"` requires (ADR-062). Biome's
`noRedundantRoles` makes the same mistake on the same files and carries the same
argument in `biome.jsonc`.

There is no code fix, so the rule stays on and the two files are named in
`ignore.overrides` in `doctor.config.jsonc`, each with a `permanent` entry in
[`public-package-suppressions.json`](public-package-suppressions.json). Do not answer
it by deleting the role: a Testing Library role query cannot see the difference,
because jsdom resolves the implicit role a browser drops. Deleting both attributes
leaves `getAllByRole('rowgroup')` and `getAllByRole('row')` returning the same
elements; only the attribute assertions in `Table.gridRoles.test.tsx` fail.

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
