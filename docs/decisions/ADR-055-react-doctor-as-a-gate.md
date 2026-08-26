# ADR-055: React Doctor as a gate, via the CLI

**Status:** Accepted

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
`doctor.config.jsonc`, failing on error severity at full scope.**

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

### Severity, not a baseline, separates inherited from new

React Doctor has **no suppression-baseline file** — no equivalent of ESLint bulk
suppressions or `reports/fallow/baselines/`. (Its internal `baseline*` machinery
is the git base ref for `--scope changed`, a different thing.) So the only dial
that distinguishes inherited debt from a new regression is severity.

The gate therefore runs at **full scope** and fails on **error** severity.
Warnings stay visible — in local runs and in the report the same scan writes —
without blocking. `--scope changed` was rejected as the primary gate: it needs a
valid base ref, and it silently degrades (see Consequences), which is a bad
property for the thing standing between a mistake and `main`.

### What is switched off, and why that is not a suppression policy hole

Two entries are off repo-wide, both because the rule cannot be right here, and
both carry their reasoning inline in `doctor.config.jsonc` and an argued entry in
[`public-package-suppressions.json`](../agents/public-package-suppressions.json):

- **`react-doctor/no-barrel-import`** — the rule's own documentation names Vite
  tree-shaking as its false-positive case. Verified rather than assumed: an entry
  importing one symbol from a flagged barrel builds to that symbol alone, with
  the barrel module elided. Acting on it would also contradict
  [ADR-007 (app home)](../../apps/showcase/docs/decisions/ADR-007-barrel-export-boundaries.md),
  which _requires_ importing through a curated barrel across a module boundary.
- **`deslop/unused-dev-dependency`** — the shared ESLint config resolves its
  plugins from the _consuming_ workspace via `fromWorkspace(name)`, a dynamic
  import by string. Each React workspace must declare `typescript-eslint`,
  `@stylexjs/eslint-plugin` and `globals` even though nothing in its own source
  imports them; removing one breaks the ESLint pass. Same class as
  [ADR-047](ADR-047-declare-optional-peer-dependencies.md). Genuinely unused
  dependencies are still caught by fallow.

One file-scoped override exists, for a confirmed false positive in
`useRunStatusSocket.hook.ts`, where the rule cannot see through a closure that
reassigns the socket.

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
- Warnings accumulate silently until someone reads the report. That is the price
  of adopting without a baseline; the triage record is what stops them being
  re-derived from scratch each time.
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
