# Adjudication case files

One file per false-positive panel case, whatever the panel ruled, named after
its case id (`FP-0001.json`). A dismissed case is what the gate compares
against
([ADR-049](../../decisions/ADR-049-findings-reports-are-produced-on-demand.md)),
and every other outcome is kept too, so the history holds every verdict and a
case number, once committed, is never handed out again. `vp run adjudicate`
takes the next number after every case here and on the default branch.

`vp run adjudicate` opens a case as `FP-0001/case.json`: the finding as the
analyzer reports it, its explanation and trace, and the flagged code. The panel
writes one `<role>-<model>.verdict.md` per seat beside it, and, on a dismissal,
an `upstream.md` draft that is never posted without the repository owner's
explicit yes. The policy is
[ADR-147](../../decisions/ADR-147-suppress-a-finding-only-after-a-blind-panel-confirms-a-false-positive.md).

Each file is an adjudication envelope:
[`adjudication.schema.json`](../../../packages/eval-history/src/envelope/adjudication.schema.json)
is its shape, and
[`packages/eval-history/README.md`](../../../packages/eval-history/README.md#recording-the-false-positive-panel)
says what it records. `vp run evals:ingest` with no path reads this directory,
and storing a case twice changes nothing.
