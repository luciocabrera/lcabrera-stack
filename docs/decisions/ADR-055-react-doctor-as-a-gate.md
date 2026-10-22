# ADR-055: React Doctor as a gate, via the CLI

**Status:** Accepted, amended 2026-10-19 (see [Amendment](#amendment-2026-10-19--the-gate-reads-blocking-and-fails-on-warnings)) and 2026-10-21 (see [Amendment](#amendment-2026-10-21--the-gate-applies-the-clis-cifailure-filter))

## Context

Three linters already run here (Oxlint, ESLint, Biome — AGENTS.md §4). React
Doctor was being run by hand, unconfigured, and its output triaged into
[`docs/agents/react-doctor-triage.md`](../agents/react-doctor-triage.md) one rule
family at a time. Two problems with that arrangement:

- An unconfigured run reports the same inapplicable findings forever. Nothing
  records that a rule was considered and rejected, so every agent re-derives the
  same judgement, and a real regression arrives in the same undifferentiated
  list as the noise.
- Nothing enforced it. A finding it would have caught reached `main` freely.

It covers ground the other three do not: effect cleanup and subscription leaks,
server/client boundary rules, render-path costs, React Compiler cleanup, and
Zod-version migration hints. That is the case for adopting it. The case against
adopting it naively is that a majority of what it reports here today is either
inapplicable to this repo's toolchain or contradicts this repo's own ADRs.

Three integration shapes were considered.

## Decision

**Run the standalone CLI as its own gate, configured by a root
`doctor.config.jsonc`, failing at full scope on the severity its `blocking`
key names** (warning and above here, since the 2026-10-19 amendment), on the
findings the CLI itself would gate on (since the 2026-10-21 amendment).

### Why the CLI rather than the lint-plugin builds

React Doctor ships `oxlint-plugin-react-doctor` and
`eslint-plugin-react-doctor`. Both were rejected:

- The Oxlint build is wired through **`jsPlugins`** — the exact bridge this repo
  removed ([ADR-042](ADR-042-oxlint-config-at-the-root.md), AGENTS.md §4) because
  bridging an ESLint-shaped plugin into Oxlint resolved the same plugin twice and
  reported every finding twice. Re-adding it reopens a closed decision to gain
  nothing the CLI does not already give.
- Both plugin builds are a **subset**. The vendor's own documentation: _"Project-
  level security-scan rules register metadata in both plugins but do not run
  under standalone ESLint or oxlint."_ Dead-code analysis is CLI-only too.
  Adopting the plugin would mean adopting the partial picture.
- A fourth engine inside Oxlint blurs the "three linters, one root config each"
  model that took ADR-042 to establish.

This does not soften the overlapping-linter policy. React Doctor's rule set is
almost entirely disjoint from the other three; where it overlaps, the engines
agree independently, which AGENTS.md §4 already treats as a safety net rather
than duplication.

### What blocks, and at what scope

**Amended 2026-10-19.** The gate now fails on whatever severity the config's
`blocking` key names, and this repository sets it to `warning`; see the
amendment below, which also records what the original paragraph said and
why it was withdrawn.

The gate runs at **full scope**. `--scope changed` was rejected as the primary
gate: it needs a valid base ref, and it silently degrades (see Consequences),
which is a bad property for the thing standing between a mistake and `main`.

### What is switched off, and why that is not a suppression policy hole

Three entries are off repo-wide (the third added by the 2026-10-19 amendment),
each because acting on the rule would be wrong here, and each carries its reasoning inline
in `doctor.config.jsonc` and an argued entry in
[`public-package-suppressions.json`](../agents/public-package-suppressions.json):

- **`react-doctor/no-barrel-import`** — the rule's own documentation names Vite
  tree-shaking as its false-positive case. Verified rather than assumed: an entry
  importing one symbol from a flagged barrel builds to that symbol alone, with
  the barrel module elided. Acting on it would also contradict
  [ADR-007](./ADR-007-barrel-export-boundaries.md),
  which _requires_ importing through a curated barrel across a module boundary.
- **`deslop/unused-dev-dependency`** — the shared ESLint config resolves its
  plugins from the _consuming_ workspace via `fromWorkspace(name)`, a dynamic
  import by string. Each React workspace must declare `typescript-eslint`,
  `@stylexjs/eslint-plugin` and `globals` even though nothing in its own source
  imports them; removing one breaks the ESLint pass. Same class as
  [ADR-047](ADR-047-declare-optional-peer-dependencies.md). Genuinely unused
  dependencies are still caught by fallow.
- **`react-doctor/js-combine-iterations`** — shipped disabled, and pinned `off`
  so a change of default cannot turn it on under the warning gate. Its
  prescribed fix fuses a `.filter().map()` chain into one pass;
  [ADR-054](ADR-054-array-operation-hierarchy.md) makes the chain the default,
  treats fusing as a hot-path optimisation applied on evidence, and measured the
  `flatMap` form as slower than the chain it replaces.

### The suppression register was extended in the same change

Adopting React Doctor adds three new ways to silence a finding —
`react-doctor-disable{,-line,-next-line}` comments, a rule set to `off`/`warn`,
and `ignore.rules` / `ignore.tags` / `ignore.files` / `ignore.overrides`. None
were known to `suppressions:verify`, and `doctor.config.jsonc` is a root file, so
the per-package `eslint-suppressions.json` gitignore that makes the four public
packages structurally suppression-free does nothing here.

Landing the gate without that coverage would have opened exactly the hole
AGENTS.md §4 built the register to close. `scripts/lib/suppressions-react-doctor.mjs`
now detects all of them, classified `targeted` vs `repo-wide` on the same rule
the Biome detector uses.

## Consequences

- A React-specific regression fails the build instead of reaching `main`.
- A warning fails the build the same way an error does (amended 2026-10-19), so
  every warning-severity rule the tool enables is a ratchet at zero rather than
  a list that grows until someone reads the report. The triage record is what
  stops an accepted finding being re-derived each time.
- **Three silent-pass modes had to be guarded**, and each would have produced a
  gate that reports success while checking nothing:
  1. Without a `doctor` script in `package.json` the CLI decides it "is not
     installed in this project", prints a setup suggestion and **exits 0**.
  2. Given a malformed config it **discards it, scans with built-in defaults, and
     still reports `ok: true`** — the same failure mode Biome has, and the reason
     `verify-react-doctor.mjs` parses the config itself before scanning.
  3. `--base` rejects `HEAD~1` (`~` fails its ref-name validation) and exits 1
     having scanned nothing, which a naive gate reads as "findings".
- **That class is not closed, and care is not the mitigation.** Four more
  instances surfaced after adoption, none of them a guarded mode: `docs:verify`
  passing only because it happened to run after the step that generates the
  report; three ways to query the report JSON that return a well-formed wrong
  answer (the diagnostics array appearing twice, the `rule` field carrying no
  plugin prefix, `filePath` being project-relative and `file` not existing at
  all); and a hand-written planted violation that did not fire, making a
  deliberately-broken probe look like a passing one. Two agents hit these in a
  single session, on one JSON file, each already alert to the pattern. The
  common shape is what defeats care: **the failure produces a plausible,
  well-formed answer rather than an error**, so nothing about the output invites
  a second look. `docs/agents/react-doctor-triage.md` carries the read-the-report
  recipe; the durable rule is that a green result from this tool is evidence only
  when something was made to fail first.
- The tool is pinned (`catalog:lint`), not `npx …@latest`: a gate whose rule set
  can change without a commit is not reproducible.
- Its licence is a **Modified MIT** — MIT plus a ban on using it as AI-training
  data and on reselling it as a hosted service. Neither restricts dev-time use,
  and as a devDependency it reaches no consumer of the published packages.
- The gate makes **no network calls**: `noScore` (score API, share URL and crash
  reporting) and `supplyChain` are both off, so a push does not depend on
  connectivity and no code metadata leaves the machine.
- Only the three React workspaces are scanned. The Node-only workspaces have no
  React, and nothing else in the repo changes.

## Amendment 2026-10-19 — the gate reads `blocking` and fails on warnings

Issue #1418. Three things above were no longer true, and the gate was not
enforcing what its config said.

- **`blocking` did nothing.** `verify-react-doctor.mjs` ran the CLI with
  `--blocking none` and failed only on `error` findings, whatever the config
  named. It now maps the key itself — `error` blocks errors, `warning` blocks
  errors and warnings, and an absent key falls back to
  the deprecated `failOn` and then to `error`, as the CLI resolves it. It
  keeps `--blocking none` on the CLI call, so the script still refuses a
  report whose `ok` is not `true` before it counts anything.
  An unknown value fails the gate rather than falling back. `none` fails it
  too: honoured, it would switch the gate off with a config edit that the
  suppression register does not read. `--report` is the advisory run.
- **This repository fails on warnings.** `doctor.config.jsonc` sets
  `"blocking": "warning"`. The maintainer chose that over `--baseline`: the
  tree is at zero warnings, so a warning is new debt the day it lands and needs
  no stored report to tell it apart from inherited debt.
- **A shadowing config fails the gate.** The loader prefers
  `doctor.config.{ts,mts,cts,js,mjs,cjs,json}` over `.jsonc`, so one of those
  beside it would replace the rules the gate believes it reads. When the
  `.jsonc` exists and one of those does too, the gate now fails before scanning
  and names the file.
- **A third rule is pinned off.** `react-doctor/js-combine-iterations` ships
  disabled, and `doctor.config.jsonc` sets it `off` explicitly, as it does
  `no-barrel-import`, so a change of default cannot make the warning gate block
  on a fix [ADR-054](ADR-054-array-operation-hierarchy.md) measured as no
  better than the chain it replaces. It carries an `acknowledged` entry in the
  suppression register like the other two, and is listed in the section above.

Corrections to the record as first written:

- It said React Doctor has no suppression-baseline file. The catalog's version
  has `--baseline <report.json>`, which reports only issues absent from a saved
  report. The gate does not use it, for the reason in the second bullet.
- It named a file-scoped override for a hook that is not in
  `doctor.config.jsonc` and whose file no longer exists in this repository. That
  sentence is removed.
- It accepted that warnings would accumulate until someone read the report.
  That consequence is replaced above.

## Amendment 2026-10-21 — the gate applies the CLI's `ciFailure` filter

Issue #1446. The CLI does not gate on every finding in its report. Before it
applies `--blocking`, it filters the findings through its `ciFailure` surface.
By default that surface drops findings tagged `design` and findings in a test or
story file (`fileContext`), and `surfaces.ciFailure` in the config can promote
or exclude findings by rule, category, tag or file context. The gate runs the
CLI at `--blocking none` and judged the whole report, so it blocked findings
that `react-doctor --blocking <level>` lets through. At `"blocking": "warning"`
a `design`-tagged warning failed the gate and passed the CLI.

`judgeReport` now applies the same filter before it checks severity, in the
CLI's order: an included rule, category or tag keeps the finding; otherwise a
file context not listed in `includeFileContexts` drops it; otherwise an excluded
rule, category or tag drops it. The report carries everything the filter
reads. A rule matches as `<plugin>/<rule>`, because the report keeps the
unqualified `rule` beside `plugin`, which is how the CLI's
`getDiagnosticRuleIdentity` builds the key. `tags` and `category` come from the
same function. `fileContext` is stamped only on a file that the CLI's
`classifyFileContext` puts somewhere other than `production`, and that function
returns only `test` or `story`. The report schema (`JsonReportDiagnosticV3`)
admits only those two values. So the CLI's rule, which is to drop any finding
with a `fileContext` that `includeFileContexts` does not name, means test and
story files. The gate copies that rule as written. The CLI's config loader also
discards any `includeCategories` or `excludeCategories` entry outside its five
category buckets (`filterKnownCategories`). A finding can still carry a category
outside them, such as `Correctness`, so the gate discards those entries too. The
gate still runs at
`--blocking none` and still asserts `ok`, so the reasons in the first amendment
for not trusting the CLI's exit code still hold. Taking the exit code was
rejected for the same reason: the gate has to name the findings that blocked,
and the exit code names none.

The filter is a copy of the CLI's rule, so a change to the CLI's defaults
needs a matching change here. One difference remains. The CLI gates each
project on that project's config merged over the root one, while the gate
reads only the root `doctor.config.jsonc`. The report keeps every finding, so `--report`
and `react-doctor:report` show what the gate let through.
