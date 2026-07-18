# ADR-035: Biome as the third linter (root-only, lint-only)

**Status:** Accepted
**Amends:** ADR-019 (which split `linter` into independent `eslint` / `oxlint` scanners — this adds a third rule engine alongside them, but deliberately **not** a third CQMS scanner; see Consequences).
**Amended:** 2026-07-18 — §7 adds the phased rule-hardening beyond the `recommended` preset.

## Context

Oxlint and eslint already run on every workspace, and between them they cover a
lot. What neither covers is a set of **React-domain correctness rules** —
notably `noNestedComponentDefinitions` (a component declared inside another
component is remounted on every parent render, silently destroying its state)
and `noDuplicatedSpreadProps` (a later spread silently overwriting an earlier
explicit prop). These are real defects that ship, and no rule in the existing
two stacks catches them.

Adding a third linter to a repo that already fought a formatter/linter conflict
(resolved 2026-07-15 by making Oxfmt's config the single source and having
eslint own `eslint-suppressions.json`'s format) is not free. The risk is not the
rules — it is the **overlap**: three engines with opinions about the same code
will contradict each other, and the cheap escape from a contradiction is to
silence one, which defeats the point of having it.

## Decision

### 1. One root-only pass, not a per-workspace fan-out

`biome.jsonc` lives at the repo root and `vp run lint:biome:check` runs one
repo-wide pass — like Oxlint, unlike the per-workspace eslint fan-out. The react
domain is scoped by `overrides` (`apps/react-router`, `apps/admin_system`,
`packages/ui`), so there is nothing to fan out.

**Do not add per-workspace `biome.jsonc` files or `lint:biome` scripts.** The
config's `overrides` already do the scoping the fan-out would duplicate.

### 2. The config is `biome.jsonc`, not `biome.json` — and that is load-bearing

Biome's parser rejects `//` comments in a `.json` file, and it **does not fail
loudly**: it discards the whole config and silently falls back to defaults,
which lints `node_modules` and reports tens of thousands of findings (or, on a
single file, a plausible-looking count with the `overrides` quietly not
applied). Every rule scoped off needs its reason recorded next to it, so the
file must stay `.jsonc`.

If Biome ever reports absurd counts or ignores an override, suspect a config
parse error first: `biome lint <file> 2>&1 | grep parse`.

### 3. Formatter and assist are OFF

`"formatter": { "enabled": false }`, `"assist": { "enabled": false }`.

Oxfmt owns formatting and eslint's `perfectionist` owns import order. Letting
Biome touch either restarts the exact formatter/linter fight this repo already
resolved once. Biome is here for **lint rules only**.

### 4. Wired into every layer of the gate, as its own step

- CI: a dedicated `Biome lint pass` step in `check-safe.yml`, after the eslint
  pass, with its own row in the job summary — a failure names itself instead of
  hiding behind a neighbour.
- `check:safe` chains `vp run lint:biome:check`.
- Pre-commit: the `staged` block in the root `vite.config.ts` invokes
  `biome lint` **directly**, not through a script. Vite+ appends the staged
  filenames to that command, and an intermediate script would have to reconcile
  those paths against Biome's own `--staged` detection. There is deliberately no
  `lint:biome:staged` — one existed briefly, was invoked by nothing, and claimed
  in the docs to be what the hook ran.
- Check-only in the hook, unlike the `vp check --fix` beside it: a Biome autofix
  there could rewrite a staged file _after_ it was reviewed. A violation fails
  the commit and `vp run lint:biome` applies the fix deliberately.

### 5. Rule 11 applies unchanged

No `// biome-ignore` to dodge a real finding, no rule-off in config to make a
gate green, and nothing baselined in `packages/ui`. A scoped-off rule in
`biome.jsonc` requires a written reason proving the finding is wrong _for that
code_, and each of the seven carries that argument inline:

| Scope                                | Rule                            | Why Biome is wrong here                                                                                                                                                                                                                                                                                     |
| ------------------------------------ | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enterpriseOrders.schema.ts`         | `noThenProperty`                | JSON Schema `if`/`then` keywords, never awaited. Oxlint already adjudicated the identical finding in this file.                                                                                                                                                                                             |
| react workspaces                     | `useExhaustiveDependencies`     | `eslint-plugin-react-hooks` already owns this rule and passes. Two engines must not both arbitrate one rule.                                                                                                                                                                                                |
| `SpacerRow.component.tsx`            | `noAriaHiddenOnFocusable`       | Models `<tr>` as a focusable grid row; this Table sets no `role=grid`/`tabIndex`. Every alternative trips another rule or announces a blank row.                                                                                                                                                            |
| `TabsContent.component.tsx`          | `noNoninteractiveTabindex`      | The APG Tabs pattern mandates `tabindex="0"` on a tabpanel. jsx-a11y allows it via `roles: ['tabpanel']`; Biome's port has no options.                                                                                                                                                                      |
| `ResizeHandle.component.tsx`         | `useSemanticElements`           | ARIA window splitter — a focusable, valued separator. The suggested `<hr>` can take neither focus nor a value.                                                                                                                                                                                              |
| `TooltipTrigger.component.tsx`       | `noStaticElementInteractions`   | The role IS set, under the same ternary as the keyboard handler. Biome cannot correlate the two; probing confirms an unconditional role passes.                                                                                                                                                             |
| test files (`*.test.*` / `*.spec.*`) | `useComponentExportOnlyModules` | A Fast-Refresh rule; HMR never touches test files (Vitest, not the dev server). The inline `Wrapper`/`TestHarness` passed to `renderHook`/`render`'s `wrapper` option is the idiomatic RTL pattern and needs a component. No option covers unexported components. Stays ON and clean for every source file. |

Prefer a rule **option** over a scope-off whenever one exists — it keeps the rule
live everywhere else. `noLabelWithoutControl` is the worked example: rather than
disabling it where a `<label>` wraps the `Checkbox` component, `inputComponents:
["Checkbox"]` teaches it the component name, and a deliberate bare `<label>`
still fails. Add future input-rendering components there rather than scoping off.

### 6. `reports/biome/full-latest.json`

`vp run lint:report` gains a third output, following the same
`<tool>/full-latest.json` convention as oxlint/eslint/fallow:
`biome lint . --reporter=json` (`{ summary, diagnostics, command }`), paths made
repo-relative, run root-only to mirror the gate. `--only=biome` scopes a
regeneration. Check-mode, like the other two — generating a report never mutates
sources.

### 7. Hardening beyond `recommended` — a phased, measured ratchet

The `recommended` preset is the floor, not the ceiling. Biome ships hundreds of
opt-in rules, and the ones that catch a real bug or enforce a convention this
repo already follows by hand are enabled on top of `recommended`, in
**approval-gated phases** so the fix effort of each is visible before it lands.
`preset` and the group keys are valid siblings under `linter.rules` in 2.5.4:
`"preset": "recommended"` stays, and individual group rules layer on top of it
without disabling the recommended set.

**Selection principle.**

- **Adopt** an opt-in rule when it catches a genuine defect class or locks in a
  convention already followed by hand — e.g. `useConsistentArrayType` is the
  _only_ enforcer of the `T[]` / `readonly T[]` convention in `typescript.md`.
- **Overlap with Oxlint/eslint is a safety net, not a conflict — when the engines
  agree.** §5's "two engines must not both arbitrate one rule" is about engines
  that _disagree_ (the `noDoubleEquals` / `no-null` trap in Consequences, or
  `useExhaustiveDependencies`, where two dep-array heuristics diverge). A rule
  where Biome and another engine reach the _same_ verdict is redundant
  enforcement that survives either config drifting — keep it. Drop a candidate
  only when the engines would fight or when it is pure noise (false positives).
- **Measure before enabling.** Each candidate is run in isolation against the live
  tree (`biome lint . --only=<group>/<rule> --reporter=summary`, read-only). A
  0-finding rule is a free ratchet; a high-count rule carries a fix budget and is
  scheduled into a later phase. Rules are never enabled blind.

**Phase 1 (2026-07-18) — free ratchets** (2 findings total, both autofixed).
Universal: `noVar`, `noUnusedExpressions`, `useErrorMessage`, `useArrayFind`,
`useConsistentArrayType` (`shorthand`), `noInferrableTypes`, `noYodaExpression`,
`useCollapsedElseIf`, `noUselessElse`, `noEnum`, `noParameterProperties`,
`noDelete`. React-only: `useSelfClosingElements`, `useFragmentSyntax`,
`noInlineStyles` (enforces StyleX-only, Rule 2). Node-only (a new override over
the 13 non-React workspaces): `useNodeAssertStrict`. Test-only:
`noExcessiveNestedTestSuites`, `useTestHooksOnTop`. Each rule carries its
justification inline in `biome.jsonc`.

**Phase 2 (2026-07-18) — cheap high-value + agreeing safety nets** (~20 fixes).
New rules: `noConsole` (allow-lists `error`/`warn`/`info`; scripts, CLIs, `.mjs`/`.cjs`
and the one sanctioned `logger.util.ts` are exempt via an override),
`noDeprecatedImports`, `noTsIgnore`, `noImplicitCoercions`, `noParameterAssign`,
`useUniqueElementIds` (React; **off for test files**, where fixtures legitimately
hard-code ids to assert on them), and the test rules `useConsistentTestIt` +
`noIdenticalTestTitle` (nursery). Plus **agreeing safety-net duplicates** — rules
another engine already owns and enforces in the _same direction_, kept as
redundant nets (0 findings): `useConsistentTypeDefinitions` (`style: "type"`,
matches ESLint `consistent-type-definitions`), `noNamespace` / `noTsIgnore`
(tseslint), `useThrowNewError` (unicorn), `noReactForwardRef` (Oxlint
`react-x/no-forward-ref`), `noUndeclaredVariables` (`no-undef`).
`noIdenticalTestTitle` earned its place immediately — it caught a verbatim-duplicated
`describe` block in `serializeFilter.util.test.ts`.

**Dropped after measurement, and the safety-net caveat.** Two candidates were
removed rather than fought into place:

- `noMisplacedAssertion` — flags `expect()` outside an `it`/`test` body, but cannot
  see through a helper. This repo uses the custom-assertion-helper pattern
  (`expectLoginRedirect`, controller helpers) which is good test hygiene, so the
  rule false-positives on a pattern worth keeping.
- `useNumberNamespace` — wants `Number.POSITIVE_INFINITY` / `Number.NaN`, which
  **directly conflicts** with the repo's ESLint `unicorn/prefer-global-number-constants`
  (wants the globals `Infinity` / `NaN` — also the repo's own convention, and its
  autofix would just revert Biome's). The rule has **no options** to skip the
  constants, and its only non-conflicting coverage (`parseInt`/`isNaN`) is already
  owned by ESLint + Biome's recommended `noGlobalIsNan`. This is the §5 case, not a
  safety net.

  **The caveat this taught:** a "safety-net duplicate" is only safe when the two
  engines enforce the **same direction** — verify that with an isolated probe
  (`biome lint --only=<rule>` vs the ESLint/Oxlint result on the same snippet),
  never assume it from the rule name. `useNumberNamespace` was _assumed_ to agree
  with unicorn; unicorn enforces the exact opposite.

**Nursery rules carry an upgrade duty.** `noInlineStyles` and `useTestHooksOnTop`
(and any future nursery adoption) can be renamed, change behaviour, or graduate
to another group on a Biome minor bump. Biome is pinned (`2.5.4`, via the
`pnpm-workspace.yaml` catalog and the `$schema` URL); on every upgrade, re-run the
per-rule `--only` sweep for each nursery rule before trusting a green gate.

## Consequences

**Three overlapping engines will contradict each other, and the resolution is
always to fix the code — never to silence one.** This is not hypothetical; it
bit immediately:

`@repo/utils`'s `mergeArrays` needed a nullish check, and the two engines
between them ruled out every idiomatic spelling of one:

- Biome's `suspicious/noDoubleEquals` rejects `baseValue == undefined` (it wants
  `===`).
- eslint's `unicorn/no-null` rejects `baseValue == null`.
- `baseValue === undefined` satisfies both — **and is wrong**: the type admits
  `null` (`readonly baseValue?: null | readonly T[]`), so strict equality stops
  matching it and the function returns `[]` where it used to return `undefined`.

The gate-green answer was the broken one. The resolution came from the domain
instead: **arrays are always truthy, even when empty**, so `!baseValue` means
exactly `null | undefined` and nothing else.

```ts
if (!baseValue && !overrideValue) {
  return undefined;
}
```

No loose `==` for Biome, no `null` named for eslint, semantics preserved, and no
suppression in either engine. The comment above it in the source records why —
because the next reader will otherwise "simplify" it back into one of the two
rejected forms.

The general lesson: when two engines contradict each other, the form that
silences both is not automatically correct. Check it against the types before
believing it.

**Not a third CQMS scanner (yet).** ADR-019 gave `eslint` and `oxlint`
independent scanner rows, master/detail tables, and runner scripts; the
`linter-checker` skill drives them. Biome gates PRs and produces a report, but
has no scanner row and is not in `linter-checker`. That is a deliberate scope
line, not an oversight — extending it is a follow-up with its own migration.
The full, execute-ready spec for that follow-up (approved then parked before
implementation) is [`docs/cqms/BIOME_SCANNER_PLAN.md`](../BIOME_SCANNER_PLAN.md):
it records the JSON-shape facts, the error/warning/info→HIGH/MEDIUM/LOW mapping,
and the load-bearing gotcha — `lint_violations.source` is a closed CHECK, so a
half-built integration ingests and then fails at INSERT in production.

**A third pass costs CI time.** It is one Biome run over ~2,800 files (sub-second
in practice), which is why a root-only pass was chosen over a fan-out.

## Verification performed

Only what was actually executed for this ADR is listed. Items adopted from
existing notes rather than re-tested are called out as such.

- Exit codes: `biome lint . --reporter=json` exits 1 on findings while still
  writing complete JSON to stdout — so the report generator's existing
  "findings exit" handling (`isFindingsExit`) applies unchanged, and only a
  genuine tool failure fails `lint:report`. Confirmed by running it.
- `reports/biome/full-latest.json`: top-level `{ summary, diagnostics, command }`,
  every `location.path` repo-relative with no absolute leakage. Confirmed by
  running the generator and asserting on the output. The diagnostic count is a
  moving snapshot of the branch (127 at time of writing, 7 of them errors) — it
  is the adoption backlog, not a fixed number.
- `--only=biome` scopes the run; `--only=bogus` is rejected naming the valid
  tools. Both executed.
- `vp run lint:report` runs all three tools and mutates no sources (verified by
  diffing the tree outside `reports/` across a run).
- The `noDoubleEquals` / `no-null` conflict in Consequences was reproduced with
  throwaway probe files against both engines: Biome accepts `== null` and
  `=== undefined` and rejects `== undefined`; eslint rejects `== null`. The
  semantic trap was read off the type, not merely assumed.

**Not verified here, carried from existing notes:** the `.jsonc`-vs-`.json`
silent-fallback behaviour (§2) and the claim that `overrides` correctly scope
the react domain to three workspaces (§1) are recorded from the Biome
integration's own findings and were not independently re-tested for this ADR.
