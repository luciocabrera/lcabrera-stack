# ADR-NNN — Version the eval run envelope and accept the previous version

**Status:** Proposed

**Governs at adoption:** `repository`

**Issue:** [#1263](https://github.com/luciocabrera/lcabrera-stack/issues/1263)

**Waits on:** nothing beyond review. `governs` is `repository` because this
is adopted before the package exists (#1265).

## Context

Each eval runner writes its own shape, and only skill-quality writes a graded
result. The skills runner saves the raw SDK message array, the verifiers save
reply text or reports, and rules-consistency writes nothing.

The history database needs one shape to ingest, and that shape will change
faster than the database schema: a new suite, a new SDK field, a new graded
detail. Runs are written to disk first and ingested later, sometimes from a
CI artifact weeks old, so the ingester meets files written by an older
runner.

## Decision

**One envelope per run**, written by every runner to
`.tmp/eval-results/<suite>/<run_id>.json` before it exits. Its schema is a Zod
schema in `@repo/eval-history`; `z.toJSONSchema` emits
`envelope.schema.json` beside it, and a test fails when that file is stale.

**`schema_version` is an integer.** It is bumped when a field is removed,
renamed, changes type, or changes meaning. Adding an optional field does not
bump it, because an ingester that ignores the field loses nothing it used to
have.

**The ingester accepts the current version and the one before it.** An
upcaster turns version N−1 into N, and is deleted when N+1 lands. Anything
else is rejected with its version and the supported range named.

**Suite-specific data lives in `detail`**, a union discriminated by a
`schema` tag such as `skills/1`. The tag is stored with the row, so a query
can tell two detail shapes apart without reading the envelope version.

**Each suite's current output becomes a projection.** The skill-quality
explorer is built from the envelope through a function that returns the shape
it reads today.

## Consequences

- A runner change that alters the envelope is a schema change: it touches the
  Zod schema, the emitted JSON Schema, the fixtures and possibly an upcaster.
  That is slower than editing a runner's `JSON.stringify`.
- An artifact two versions old cannot be ingested. History from before an
  upgrade has to be ingested before the next one.
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

## References

- [`eval-history-plan.md`](../eval-history-plan.md) §2
- [`eval-history-prd.md`](../eval-history-prd.md) FR-1, risk "schema changes faster than the envelope"
