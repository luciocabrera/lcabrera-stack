# `@lcabrera/scan-report` — architecture

The scanners behind the `linter-checker`, `code-smell-checker`,
`code-smell-zen` and `fallow-code-checker` skills. They used to live under
`.github/skills/*/scripts/`, where they could only ever be copied into another
repository; [ADR-069](../../docs/decisions/ADR-069-publish-the-shared-toolchain.md)
made them a package instead, and the skills kept their `SKILL.md` — prompt text
is per-repository, code is not.

## Layout

| File                            | Role                                                                         |
| ------------------------------- | ---------------------------------------------------------------------------- |
| `deterministic-scan-shared.mjs` | scanner-agnostic run context, artifact writing, finding ids, the ingest step |
| `lint-report-shared.mjs`        | lint-specific report building/rendering; re-exports the above                |
| `finding-templates.mjs`         | per-rule why/fix wording, shared with any consumer that re-derives findings  |
| `generate-oxlint-report.mjs`    | oxlint scanner (`scan-report-oxlint`)                                        |
| `generate-eslint-report.mjs`    | eslint scanner (`scan-report-eslint`)                                        |
| `generate-fallow-report.mjs`    | fallow scanner (`scan-report-fallow`)                                        |
| `ingest-report.mjs`             | `scan-report-ingest` — persists a run an agent produced by hand              |
| `run-ingestion.mjs`             | the one place that decides how each ingestion outcome is reported            |
| `ingest-configuration.mjs`      | resolves the configured ingestion command; knows no product                  |
| `resolve-host-root.mjs`         | where "here" is                                                              |
| `run-fallow.sh`                 | the interactive fallow skill's two-pass capture helper                       |

## Three decisions worth knowing before editing

**It ships source, and that is not the trap it is for the other public
packages.** `packages/CLAUDE.md` warns that a `.ts` file inside `node_modules`
cannot be loaded at all. These are `.mjs` — plain ESM that node runs unmodified —
so there is no build step, no `dist`, and no `publishConfig.exports`
substitution. `publish:verify` scopes itself to packages with a `build` script
and therefore skips this one by construction, not by exemption.

**Its versioned contract is the report shape, not a TypeScript surface.** The
package is deliberately absent from `PUBLIC_PACKAGE_DIRS` in
`scripts/lib/api-surface-config.mjs`: what a consumer depends on is the CLI flag
set and `SCHEMA_V1.md`/`REPORT_JSON_CONTRACT.md`, and snapshotting the two
hand-written `.d.mts` files would ratchet the wrong thing while leaving the real
contract ungated. Change either document and you have changed the contract, with
or without a type diff.

**The host root is derived from the install location, never from `cwd`.** An
orchestrator spawns these runners from wherever it happens to be, so a
`cwd`-derived root would silently point at the scanned project — putting scratch
files inside someone else's working tree and resolving the fallow binary from a
repository that never installed it. `resolveHostRoot` walks left of the first
`node_modules` segment for an installed copy (pnpm nests a second one under
`.pnpm`, so the first is the one that lands on the consumer) and falls back to
the nearest `.git` ancestor when the code is being run from a checkout.

## The ingestion seam

`ingest-configuration.mjs` resolves a command; `run-ingestion.mjs` runs it and
reports one of three outcomes. Nothing in the package knows what the command
does, which is the whole point — the scanners are useful without one.

The outcomes are deliberately not interchangeable:

| Outcome    | Exit | Because                                                            |
| ---------- | ---- | ------------------------------------------------------------------ |
| `skipped`  | 0    | no command configured (or `--skip-ingest`) — a normal state        |
| `ingested` | 0    | the command completed                                              |
| `failed`   | 1    | a command that IS configured did not complete — not a normal state |

Collapsing `failed` back into a warning is what let a permanent breakage read as
a transient blip, and is the specific regression this split exists to prevent.

## Adding a scanner

Add `generate-<tool>-report.mjs` beside the others, import the shared context
from `deterministic-scan-shared.mjs`, and add a `bin` entry plus an `exports`
subpath. Nothing else needs to change: the flag contract, the artifact writer
and the ingest step are all inherited.
