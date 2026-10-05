---
governs:
  - repository
---

# ADR-131 — Version the eval run envelope and accept the previous version

**Status:** Accepted

**Issue:** [#1263](https://github.com/luciocabrera/lcabrera-stack/issues/1263)

## Context

Each eval runner writes its own shape, and only skill-quality writes a graded
result. The skills runner saves the raw SDK message array, the verifiers save
reply text or reports, and rules-consistency writes nothing.

The history database needs one shape to ingest, and that shape will change
faster than the database schema: a new suite, a new SDK field, a new graded
detail. Runs are written to disk first and ingested later, sometimes from a
CI artifact weeks old, so the ingester meets files written by an older
runner.

`governs` is `repository` because this decision is adopted before the
workspace that implements it exists (#1265).

## Decision

**One envelope per run**, written by every runner to
`.tmp/eval-results/<suite>/<run_id>.json` before it exits. Its schema is a Zod
schema in `@repo/eval-history`; `z.toJSONSchema` emits
`envelope.schema.json` beside it, and a test fails when that file is stale.

**`schema_version` is an integer**, starting at `1`. The test for a bump is
whether a file the previous schema accepted still parses, and still means the
same thing, under the new one.

These changes bump `schema_version`:

- removing a field;
- renaming a field;
- changing a field's type, including making it nullable or optional where it
  was required, or required where it was optional;
- removing a value from an enumerated field such as `suite`, `trigger`,
  `status` or `outcome`;
- changing what a field means while keeping its name and type: its unit, its
  time zone, how it is derived, or what `null` stands for.

These changes do not:

- adding an optional or nullable field, because an ingester that ignores it
  loses nothing it used to have;
- adding a value to an enumerated field, such as a new suite or trigger;
- adding a suite's `detail` variant under a new `schema` tag;
- changing the JSON Schema file's formatting, or a Zod refinement that every
  previously valid file still passes.

**The ingester accepts the current version and the one before it.** An
upcaster turns version N−1 into N. When N+1 lands, the N−1 upcaster is deleted
and one from N to N+1 replaces it. Any other version is rejected with its
version and the supported range named.

**Suite-specific data lives in `detail`**, a union discriminated by a
`schema` tag such as `skills/1`. The tag is stored with the row, so a query
can tell two detail shapes apart without reading the envelope version. A
change inside one suite's `detail` that the rules above would call breaking
bumps that suite's tag (`skills/1` to `skills/2`), not `schema_version`, and
the ingester keeps the same window for it: the current tag and the one
before, through an upcaster.

**Each suite's current output becomes a projection.** The skill-quality
explorer is built from the envelope through a function that returns the shape
it reads today.

## Consequences

- A runner change that alters the envelope is a schema change: it touches the
  Zod schema, the emitted JSON Schema, the fixtures and possibly an upcaster.
  That is slower than editing a runner's `JSON.stringify`.
- An artifact two versions old cannot be ingested. History from before an
  upgrade has to be ingested before the next one.
- Additive changes are free, so the envelope will collect optional fields
  that a later breaking change has to prune. The bump is the only point at
  which that clean-up happens.
- Raw judge replies and transcripts are never inside the envelope's
  `detail`, only behind a transcript pointer. Graded prose (a quality
  judge's `summary` and `feedback`) is in `detail`, so the envelope as a
  whole is not public-safe; the dashboard's allow-list is what keeps that
  prose off public routes.

## Alternatives considered

- **Semantic version string.** Rejected: the only question a reader asks is
  "can I read this", and an integer with a stated bump rule answers it.
- **No version; additive changes only.** Rejected: it forbids the renames a
  young format needs, or lets them happen silently.
- **One envelope per trial.** Rejected: the run is the unit of idempotency
  (`run_id`) and of provenance (one SHA, one model, one setting set).
- **Accept every version ever written.** Rejected: each version kept means
  a chain of upcasters and a fixture per step, all tested, for files that
  stop arriving once the 90-day artifact retention passes.

## References

- [`eval-history-plan.md`](../agents/planning/eval-history-plan.md) §2
- [`eval-history-prd.md`](../agents/planning/eval-history-prd.md) FR-1, risk
  "schema changes faster than the envelope"
- [#1260](https://github.com/luciocabrera/lcabrera-stack/issues/1260), the
  epic, and its recorded stakeholder answers
