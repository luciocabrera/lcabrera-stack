# Adjudication case files

One file per dismissed false-positive panel case, named after its case id
(`FP-0001.json`). A dismissed case is a confirmed false positive, and the gate
compares against it, so its file is tracked here
([ADR-049](../../decisions/ADR-049-findings-reports-are-produced-on-demand.md)).
Cases with any other outcome are not tracked.

Each file is an adjudication envelope:
[`adjudication.schema.json`](../../../packages/eval-history/src/envelope/adjudication.schema.json)
is its shape, and
[`packages/eval-history/README.md`](../../../packages/eval-history/README.md#recording-the-false-positive-panel)
says what it records. `vp run evals:ingest` with no path reads this directory,
and storing a case twice changes nothing.
