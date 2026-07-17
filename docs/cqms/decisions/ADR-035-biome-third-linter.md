# ADR-035: Biome as the third linter (root-only, lint-only)

**Status:** Accepted
**Amends:** ADR-019 (which split `linter` into independent `eslint` / `oxlint` scanners — this adds a third rule engine alongside them, but deliberately **not** a third CQMS scanner; see Consequences).

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
