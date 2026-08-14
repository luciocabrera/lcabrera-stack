---
name: lint-toolchain
description: Configure or debug this repo's four analysers — Oxlint, the eslint custom-rules pass, Biome, and SonarCloud. Use when editing root `vite.config.ts` lint config, `biome.jsonc`, an `eslint.config.mjs`, the suppressions register, or `.sonarcloud.properties`; and when a lint gate behaves unexpectedly (a rule that reports nothing, a green run you don't trust, a Sonar finding you can't reproduce).
user-invocable: true
paths:
  [
    '**/biome.jsonc',
    '**/eslint.config.mjs',
    '**/.sonarcloud.properties',
    'vite.config.ts',
  ]
allowed-tools: Read, Grep, Glob, Bash(vp:*)
---

# Lint toolchain — Oxlint, eslint, Biome, Sonar

Configuration lore for the four analysers. **Non-Negotiable Rule 11 (AGENTS.md
§5) governs all of them and is not repeated here: never ignore, suppress, or omit
a finding — verify, then fix the code.** This skill is the _how the engines are
wired_ half.

The cardinal trap, common to every engine below: **a rule that is not loaded
reports exactly the same clean pass as code that is correct.** Always confirm a
lint change with a deliberate violation. That is also why `vp run
lint:plugins:verify` lints a planted violation per plugin family rather than
reading the config — reading the config is exactly what cannot tell a loaded
family from a missing one.

## Oxlint

**All Oxlint config lives in the root `vite.config.ts`; a per-workspace `lint`
block does nothing.** This is Vite+'s documented monorepo model, not a defect —
the root config holds the defaults and `lint.overrides` carries per-package
differences, with globs resolved from the root (`packages/ui/**`). A package's
own `vite.config.ts` is for its Vite/Vitest/framework config. See
`node_modules/vite-plus/docs/guide/monorepo.md`, including its "Composing
Configuration Files" section, which is the supported way to keep the rule sets in
separate files and merge them into overrides.

The config comes from `@lcabrera/vite-config/lint`'s `createLintConfig`, called by
the root config with this repo's `WORKSPACE_RUNTIMES` roster — the factory
pattern kept, moved to where Vite+ reads it
([ADR-042](../../../docs/decisions/ADR-042-oxlint-config-at-the-root.md), #318).
The repo ran the other way round for a long time, with a `lint` block in every
workspace built from a `*-lint` factory and **none of it loaded**; that layer is
gone. `vp run lint:plugins:verify` now fails on a `lint` key in any workspace
config, so it cannot come back.

**Oxlint runs no ESLint-plugin rules.** The `jsPlugins` bridge is gone: the
eslint pass already loads `react-x`, `react-dom`, `@stylexjs`, `local-rules`,
`perfectionist` and `security` and enforces the same rules, so bridging them into
Oxlint resolved the same plugin twice to report the same finding twice. This does
not soften the overlapping-linter policy — overlap earns its keep where the
engines **independently** agree, not where one shells out to the other's plugin.

Four behaviours mask a broken setup as a clean one:

- **Naming `plugins` REPLACES Oxlint's default set** rather than adding to it, so
  the defaults (`eslint`, `oxc`, `typescript`, `unicorn`) must be repeated.
  Omitting one switches that whole family off repo-wide and reports nothing. This
  is not hypothetical: the first attempt to fix #318 added a four-entry `plugins`
  list to the root and silently disabled `typescript`, `unicorn` and `oxc` — the
  repo stayed green the entire time.
- **A plugin without its category is decorative.** A plugin contributes only
  rules whose category is enabled, so listing one whose rules all sit in a
  disabled category reads as protection that is not there. Measure before adding:
  drop it and compare `number_of_rules` from `vp lint . --format=json`.
- **A warning fails nothing.** `vp lint .` and `vp check` both exit 0 while
  printing "Found 0 errors and 1 warning", so a category left at Oxlint's default
  `warn` is advisory. `correctness` was at `warn`, which meant a `debugger`
  statement passed every gate; the root block now pins
  `categories: { correctness: 'error' }`.
- **A category severity outranks an individual `rules` entry** for a rule inside
  it. With `correctness: 'warn'` in force, setting `no-debugger: 'error'` still
  reported a warning. Set the category, not the rule. This is also what produced
  two wrong diagnoses of #318 — probing with `no-debugger` cannot distinguish
  "config ignored" from "category masked my rule". Probe with a rule outside the
  category (Rule 14).

One override semantic to know before writing one: **an override's `plugins` list
replaces the base list** for matched files, so it must name every plugin that
group needs.

The other categories are **not** free; measure one before enabling it
(`vp lint . --format=json`).

## The three linters — and none of them is `vp check`

A fourth analyser, React Doctor, gates alongside them but is deliberately not one
of the three: it is a standalone CLI with its own root config and its own report,
not an engine in the lint fan-out, and its rule set is nearly disjoint from
theirs — [ADR-055](../../../docs/decisions/ADR-055-react-doctor-as-a-gate.md).

Oxlint (`vp lint`) covers the whole tree from the root; the eslint pass
(`vp run lint:eslint` / `lint:eslint:check`) exists in every workspace — React
workspaces use `@lcabrera/vite-config/eslint-custom-rules`, node/library workspaces
use `@lcabrera/vite-config/eslint-base-custom-rules` (same stack minus React/StyleX,
and without `clean-import-paths`, which strips the import extensions
node-resolution code requires).

Inherited eslint violations are baselined per workspace in
`eslint-suppressions.json` (ESLint bulk suppressions) — **new violations fail the
gate**: CI runs `vp run -r lint:eslint:check` as its own step in
`check-safe.yml`, because `vp check` covers only fmt + Oxlint + the tsgolint type
pass and would let every eslint-only finding through. Burn debt down and shrink
the baseline with `npx eslint . --config eslint.config.mjs --prune-suppressions`.
Never add new entries by hand.

**`packages/ui`, `packages/api`, `packages/server` and `packages/utils` are held
strictest** — all four are public-facing, so every finding there gets fixed
rather than baselined or disabled, and an exception has to be argued in writing
before it exists. That is **checked** (`vp run suppressions:verify`, CI step in
`check-safe.yml`) rather than asserted, across every mechanism that can silence a
finding in them. Anything not carrying a justified entry in
[`docs/agents/public-package-suppressions.json`](../../../docs/agents/public-package-suppressions.json)
fails the build — and so does an entry whose code has since gone, which is what
stops the register becoming the baseline it replaces. The protocol is
[`docs/agents/public-package-suppressions.md`](../../../docs/agents/public-package-suppressions.md);
`vp run suppressions:list` prints the current state. **Do not restate the
mechanism list anywhere** — that table is in the protocol doc, and a second copy
is a copy nothing checks.

The register has **two lists**, and the split is load-bearing. `approved` holds
suppressions scoped to a public package — the rule is off _because of_ that
package, and each needs an argument for why the engine is wrong about that
specific code. `acknowledged` holds repo-wide policy (ADR-035 §7) that merely
reaches one, because the package contains a test file, a config or a tooling
script. Both are enforced: an early version gated only the first, which left a
hole where a _new_ override broad enough to match a public package **and**
anything else needed no entry at all. Classification is by what a glob
**resolves to**, never by how it looks — `**/logger.util.ts` reads like a
category pattern and is in fact a single `packages/ui` file.

This used to say the four were "never silenced", full stop, and that was false
when written — `packages/ui` carried a good number of inline directives and
targeted Biome rule-offs. Most are defensible, but nothing distinguished a
reviewed exception from one added last Tuesday, and a rule nobody can comply with
gets ignored wholesale. The honest form is "no _unapproved_ suppression", and it
only means anything because something now counts them. The check does **not**
cover repo-wide Biome category rules (`**/*.test.ts`, `**/*.mjs`) that a public
package merely falls inside — those are ADR-035 §7's business.

Each one's `eslint-suppressions.json` path is **gitignored**: ESLint's
bulk-suppressions tooling — an editor extension, or `--prune-suppressions` run
across every workspace — regenerates an empty `{}` for a workspace with nothing
to suppress, and committing/deleting it was an endless loop. Because CI checks
out no file, all four packages are suppression-free by construction and any real
finding fails the gate. Never un-ignore any of them or commit a non-empty one. To
check the real membership rather than trusting a list, grep the workspace
`.gitignore`s for `eslint-suppressions`.

**A directive must name the engine that reads it — `eslint-disable` for ESLint,
`oxlint-disable` for Oxlint.** Oxlint honours `eslint-disable` comments too, and
that overlap used to hide real rot: `reportUnusedDisableDirectives` was off
precisely because eslint would call an Oxlint-only directive "unused" and `--fix`
would delete it. With the option off, though, a directive suppressing _nothing_
looked exactly like compliant code — zero findings either way — and 13
accumulated repo-wide, four of them claiming to hold back `no-console` in a
logger no rule was flagging. The five real Oxlint-only cases were spelled
`typescript-eslint/unbound-method` (no `@`, which Oxlint accepts and eslint does
not recognise); they now say `oxlint-disable-next-line`, so
**`reportUnusedDisableDirectives` is `'error'`** in both shared configs. "Unused"
now means the directive is dead (delete it) or misnamed (respell it) — never
load-bearing.

## Biome

**Biome is the third linter** (`vp run lint:biome:check`, CI step in
`check-safe.yml` after the eslint pass, and a pre-commit `staged` entry in the
root `vite.config.ts`). It is configured **once at the root** in `biome.jsonc`
and runs one repo-wide pass — like Oxlint, unlike the per-workspace eslint
fan-out. Do not add per-workspace `biome.jsonc` files or `lint:biome` scripts;
`overrides` already scope per project. Full rationale — including why it is
lint-only and why it is not a CQMS scanner — is in
[ADR-035](../../../docs/decisions/ADR-035-biome-third-linter.md). The rule set
goes **beyond `recommended`**: a curated set of opt-in rules is enabled on top of
the preset, added in approval-gated phases and measured per rule before landing
(ADR-035 §7). Overlap with Oxlint/eslint is kept as a deliberate safety net where
the engines **agree**; only genuinely conflicting or noisy rules are dropped.

Four constraints hold it in place:

- **Formatter and assist are OFF** (`formatter.enabled: false`,
  `assist.enabled: false`). Oxfmt owns formatting and eslint-perfectionist owns
  import order. Turning either on restarts the formatter/linter fight that the
  `eslint-suppressions.json` ignore rule already had to settle once.
- **Domains are scoped per project, not global.** The `react` domain is enabled
  in an `overrides` entry covering only the three React workspaces
  (`apps/react-router`, `apps/admin_system`, `packages/ui`) — enabling it
  globally would apply React rules to the Express/Fastify/node workspaces. `test`
  is scoped to test files; `project` runs repo-wide. Both add zero findings today
  and exist to guard future code.
- **`domains: { react: "recommended" }` does NOT enable every react rule** — this
  is the trap. `noNestedComponentDefinitions` and `noDuplicatedSpreadProps` are
  react-domain rules that fire only under `"all"` or when listed explicitly, so
  they are pinned by name at `error` in the same override
  (`noDuplicatedSpreadProps` also defaults to `warn`, which would not fail the
  gate).
- **Do not adopt `domains: { react: "all" }`.** It adds a large number of
  findings that contradict this repo's own ADRs — e.g.
  `noJsxPropsBind`/`noLeakedRender` vs ADR-004 (React Compiler owns
  memoization). Individual react rules worth having are pinned by name instead:
  `useComponentExportOnlyModules` is enabled explicitly at `error` — off for test
  files — and is clean on every source file, ADR-007 barrels included.
- **The config is `biome.jsonc`, not `biome.json`, and that is load-bearing.**
  Biome's config parser rejects `//` comments in a `.json` file — and it does not
  fail loudly: it **discards the entire config and silently falls back to
  defaults**, which lints `node_modules` and reports tens of thousands of
  findings (or, on a single file, a plausible-looking count with your `overrides`
  quietly not applied). Every rule scoped off here needs its reason next to it,
  so the file must stay `.jsonc`. If Biome ever starts reporting absurd counts or
  ignoring an override, suspect a config parse error first:
  `biome lint <file> 2>&1 | grep parse`.

A fixed set of rules is scoped off in `overrides`, each with its reason inline —
all of them cases where Biome is wrong, not where the code is (`noThenProperty`,
`useExhaustiveDependencies`, `noAriaHiddenOnFocusable`, `noNoninteractiveTabindex`,
`useSemanticElements`, `noStaticElementInteractions`,
`useComponentExportOnlyModules`). **ADR-035 §5 is the table** listing each with
its justification; read it before adding another, and match that bar. Several are
Biome mismodelling an ARIA pattern the code implements correctly (window
splitter, APG tabs panel, non-grid table row, conditional tooltip role);
`useComponentExportOnlyModules` is off only for test files, where Fast Refresh
never runs. Those are §5's "Biome is wrong for _this code_" cases; the phased
hardening (ADR-035 §7) adds a **separate** class of scope-off — whole rules
turned off for a file _category_ where they don't apply, not for a mistaken
finding: test-file exemptions (`noShadow`, `noEmptyBlockStatements`,
`useUniqueElementIds` — idiomatic mock/fixture patterns) and framework/tooling
exemptions (`noConsole` for scripts/CLIs/logger, `noDefaultExport` for
routes/configs/entry/eslint-rules). Those are catalogued in §7, not counted among
the §5 set.

**Prefer a rule option over a scope-off.** An option keeps the rule live
everywhere else; a scope-off blinds it for a whole file. `noLabelWithoutControl`
is the worked example: a `<label>` wrapping the `Checkbox` _component_ is correct
HTML — Biome just cannot see through the component boundary — so
`inputComponents: ["Checkbox"]` teaches it the name instead of disabling it, and
a bare `<label>` with no control still fails. Add future input-rendering
components to that list.

**Biome conflicts with eslint on how to return "nothing" from a `map` callback.**
`useIterableCallbackReturn` demands a returned value, while `unicorn/no-null`
bans `null` and `unicorn/no-useless-undefined` bans `undefined` — all three
spellings fail one linter or the other. Restructure instead: `filter` the empty
cases out before the `map`, so the callback always returns an element
(`NotificationCenter.component.tsx` is the worked example). The same pairing
bites nullish checks: `== undefined` trips Biome's `noDoubleEquals` and `== null`
trips `unicorn/no-null`, so lean on arrays/objects always being truthy
(`merge-arrays.util.ts`).

## Reports

**Lint JSON reports** follow the fallow output convention: `vp run lint:report`
(script: `scripts/generate-lint-reports.mjs`, supports
`--only=biome|eslint|oxlint`) regenerates `reports/oxlint/full-latest.json` (one
repo-wide `vp lint . --format=json` run), `reports/eslint/full-latest.json` (the
standard eslint `--format json` result array merged across every workspace,
repo-relative paths), and `reports/biome/full-latest.json` (one repo-wide
`biome lint . --reporter=json` run — root-only, mirroring the gate, since
`biome.jsonc`'s `overrides` already scope the react domain and there is nothing
to fan out). **All three are gitignored — run the command rather than reading a
committed snapshot** (ADR-049). ESLint runs in check mode — regenerating a report
never mutates sources — and the baselined debt is visible per file in each
entry's `suppressedMessages`, so the report is the place to inspect what the
suppressions actually cover.

## SonarCloud

**SonarCloud findings** (`vp run sonar:report`, script `scripts/sonar-report.mjs`)
follow the same convention: it pulls the project's open issues + security
hotspots + quality-gate status from the SonarCloud **Web API** and writes
`reports/sonar/runs/<target>.json`, so agents act on Sonar from a file they
produce like they do the lint/fallow reports — not the dashboard. This is
necessary because SonarCloud runs here in **Automatic Analysis** mode: the GitHub
App analyses each push server-side, there is no scanner step in the repo to read,
and feature branches are analysed as **pull requests** (a `branch=<feature>`
query 404s — pass `--pr <n>`).

**Nothing is committed** — every target, `main` included, writes its own file
under the gitignored `reports/sonar/runs/` (ADR-049). It used to commit a `main`
snapshot, and every run wrote that one path: the routine way to read a branch's
own findings overwrote `main`'s, and PR #283's analysis then sat committed as
`main`'s across many merges, reporting a failing gate and two findings `main` did
not have, one already accepted in SonarCloud. Restricting the tracked path to a
`main` analysis fixed that instance and not the class — the file still moved only
when someone remembered. With nothing tracked, reading a pull request's analysis
as `main`'s is impossible rather than guarded.

Auth is a read-only `SONAR_TOKEN` loaded from a gitignored root `.env` or a CI
secret — **never committed** (see `.env.example`); the script uses no
`child_process` (an `execFile('git'|'gh', …)` would trip Sonar's own S4036 PATH
hotspot). `vp run sonar:verify` (`--gate`) is the enforcement half: it exits
non-zero when the quality gate is failing, a local mirror of the SonarCloud gate,
and `--fail-on-issues` also fails on any open issue.

**Two-layer enforcement is wired:**

1. SonarCloud's own **"SonarCloud Code Analysis" required check** (branch ruleset
   on `main`) gates on the "Sonar way" gate — rating-based, so it catches new
   bugs/vulns/hotspots/coverage/duplication but **not** new code smells
   (assigning a stricter custom gate is a paid SonarCloud feature).
2. The **`.github/workflows/sonar-issue-gate.yml`** job closes that gap for free
   — it runs `sonar-report.mjs --gate --fail-on-issues --wait` on every PR and
   fails on **any** open issue (the code smells layer 1 misses). `--wait` polls
   the Compute Engine (`api/ce/activity`) until the PR head commit's analysis has
   finished — Automatic Analysis is async and runs in parallel with CI, so a bare
   read races it; `--since` (the head commit time) is the freshness guard, and on
   timeout the job **skips** rather than blocks. Without a token (fork PRs) the
   script skips and the job stays green. To make layer 2 blocking, add the
   **"Strict Sonar issue gate"** check to the `main` ruleset's required checks
   after it has run once.

**Sonar's own analysis settings live in `.sonarcloud.properties`** — not
`sonar-project.properties`, which Automatic Analysis ignores outright, and which
is therefore the file to avoid creating. Two consequences worth knowing before
editing it: it is read from the **default branch only**, so a change has no
effect until it merges to `main` (a PR cannot demonstrate it working), and
**wildcard patterns are not supported**, which rules out path globs like
`…/migrations/**` and pushes fixes towards language settings instead. Today it
holds **no settings at all**, and that is the lesson: it tried to unclaim `.sql`
from the Oracle PL/SQL analyser (`sonar.plsql.file.suffixes`) and the property
was simply never applied. **Language settings belong in the SonarCloud UI**
(Administration → Languages), not here — `.sql` comes out of PL/SQL's suffixes
and goes into PostgreSQL's. SonarQube Cloud _does_ ship a PostgreSQL analyser (a
Deterministic Rule Engine, `sonar.dre.postgres.activate`, on by default, suffixes
`pgsql,psql`); assuming it did not is what made "rename the migrations so nothing
analyses them" look like the only way out. The file's own comment carries the
full account, including the worked contradiction from #73 — read it before adding
any language property here.
