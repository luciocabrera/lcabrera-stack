# ADR-091 — Retire `@repo/scan-report` and the `app-graph` skill

**Status:** Accepted · **Date:** 2026-08-25 · **Issue:** #941

## Context

[ADR-069](./ADR-069-publish-the-shared-toolchain.md) planned to publish this
package as `@lcabrera/scan-report`. Its
[amendment](./ADR-069-publish-the-shared-toolchain.md#amendment-2026-08-14--scan-report-does-not-publish)
withdrew that, and its reasoning was unambiguous:

> "no consumer survives the extraction with a reason to exist independently of
> CQMS"
> "the one consumer staying here — the `app-graph` skill — is itself
> CQMS-coupled"
> "a report schema that means nothing without a CQMS to ingest it"

The question that amendment answered was **publish or do not publish**. It
concluded "do not — it leaves with the extraction." The extraction happened; the
package did not leave, because nobody asked the other question. The repository
then acquired a justification for keeping it — the scan skills execute its
scripts — which is circular: those skills exist to feed a pipeline whose
consumer is the thing that left.

Four facts, each checked against the tree rather than inferred:

1. **The ingestion half cannot run here.** `ingest-report.mjs`,
   `ingest-configuration.mjs` and `run-ingestion.mjs` (plus three test files)
   exist to forward a report to a configured ingestion command. There is no
   `scan-report.config.json` in this repository, so every invocation takes the
   documented "Ingestion skipped" path.
2. **It never worked even when there was something to ingest.** ADR-069 records
   it: "#714 records that ingestion had been failing silently the whole time" —
   the runners passed `--local-path` while the ingestion CLI required
   `--project-id`, and the failure was swallowed as a best-effort warning.
3. **The lint half duplicates existing tooling.** `vp run lint:report`
   (`scripts/generate-lint-reports.mjs`) already writes
   `reports/{oxlint,eslint,biome}/full-latest.json` repo-wide, with no
   involvement from this package.
4. **Neither is wired to anything.** No workflow and no root gate script invokes
   either. `app-graph` is not in AGENTS.md §3's scan-selection list.

## Decision

**Delete `packages/scan-report` and `.github/skills/app-graph/`.**

The report **contract** survives the package. `SCHEMA_V1.md` and
`REPORT_JSON_CONTRACT.md` move to `.github/skills/code-smell-shared/`, which is
where the skills that follow them already live. This is ADR-069's own rule
applied consistently: it kept `SKILL.md` out of the package because "prompt text
is per-repository, code is not", and a report shape agreed between a scanner and
whatever reads it is per-repository for exactly the same reason.

The dependent skills keep working, on tooling this repository already has:

| Skill                 | Was                                                        | Now                  |
| --------------------- | ---------------------------------------------------------- | -------------------- |
| `app-graph`           | `@repo/scan-report/deterministic-scan`                     | **deleted**          |
| `linter-checker`      | `generate-oxlint-report.mjs`, `generate-eslint-report.mjs` | `vp run lint:report` |
| `fallow-code-checker` | `run-fallow.sh`, `ingest-report.mjs`                       | `vp run fallow:*`    |
| `code-smell-checker`  | `ingest-report.mjs`                                        | no ingest step       |
| `code-smell-zen`      | `ingest-report.mjs`                                        | no ingest step       |

The ingest step is removed from every skill rather than made configurable. A
step that has never once run in this repository, and that failed silently for
its whole life where it did run, is not a feature being withdrawn.

## Consequences

- **`@repo/*` loses one workspace.** `packages/scan-report` was never published,
  so nothing is withdrawn from a registry and no consumer outside this
  repository is affected.
- **`app-graph` has no replacement, deliberately.** It produced a folder/file
  inventory with export/function/type counts. What that was for is served by the
  `INVENTORY.md` files, the `inventory:verify` gate, and fallow.
- **The scan skills stop emitting a machine-readable `report.json` from a
  runner.** `linter-checker` now points at the canonical `reports/` tree, which
  is what every other consumer of lint output in this repository already reads.
- **A report can no longer be forwarded anywhere.** If a future consumer wants
  ingestion, it arrives with that consumer and is designed for it, rather than
  being carried indefinitely against the possibility.

## Alternatives considered

- **Keep the package, delete only `app-graph`.** Rejected: it leaves ~700 lines
  of ingestion that cannot run, and a second lint-report generator competing
  with `lint:report`. The coupling ADR-069 identified is not confined to
  `app-graph`.
- **Keep the ingestion half against a future consumer.** Rejected: the same
  reasoning kept it through the extraction and produced code that has never
  executed its main path here. `docs/agents/dependency-advisories.md` makes the
  general form of this argument — there is deliberately no permanent form of a
  "keep it in case" allowance.
- **Publish it after all, so the schema is versioned.** Rejected again, on
  ADR-069's amendment's own grounds: an npm version is permanent, and this is a
  report shape rather than an API surface.
- **Move the runners into `@lcabrera/devkit` or `@lcabrera/repo-standards`.**
  Rejected: both are consumed outside this repository, and this is exactly the
  repo-specific data ADR-069 took out of them.
