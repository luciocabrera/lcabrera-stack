# ADR-NNN — Serve the eval dashboard from the showcase app, public and aggregate-only

**Status:** Proposed

**Governs at adoption:** `showcase`

**Issue:** [#1264](https://github.com/luciocabrera/lcabrera-stack/issues/1264)

**Waits on:** questions 3 and 4 in
[`eval-history-plan.md`](../eval-history-plan.md#12-questions-for-stakeholders).

## Context

The requirements recommend an `/evals` feature in the showcase app, behind a
feature flag, with transcripts behind auth. Four things the showcase does not
have shape how that can be done:

- **A working login guard.** `apps/showcase/src/auth/authMiddleware.ts`
  exists and is applied to no route; the note in
  `routes/enterprise-orders/root.ts` says it broke client-side navigation.
- **A feature-flag mechanism.** The only switch is the build-time
  `VITE_API_URL`.
- **A chart library.** None is in any manifest or the lockfile.
- **A table reader for a second database.** `createTablePageReader` in
  `@lcabrera/server` runs through `getPool()`, which reads the `DB_*`
  variables.

## Decision

**`/evals` lives in the showcase**, one folder per route under
`apps/showcase/src/routes/evals/`, reading through `@repo/eval-history` with
the `evals_reader` role.

**Every route is public and serves aggregates only.** No route returns
transcript text, a prompt, a judge reply, or any `detail` field outside an
allow-list held in the package's query functions: invoked skills, verdict,
not-met criterion numbers, dimension scores. A test seeds a marker string
into every transcript and reply field, renders every loader, and fails if the
marker appears in any payload. Transcripts stay in CI artifacts.

**The flag is `EVALS_DASHBOARD=1`**, a server variable read by one helper that
every `/evals` loader calls. Unset, the loader throws a 404 `Response`. It is
not a `VITE_` variable, so it never reaches the client bundle.

**Tables use `TableRouteView`** through `createTableRouteLoader` with a
`fetchPage` the package implements, not through `createTablePageReader`.

**Charts are SVG drawn with StyleX.** Sparkline, trend with bands, heatmap and
matrix are small, fixed shapes.

## Consequences

- Low or noisy scores are visible to anyone the deployment is visible to, with
  the context the page gives them and no more. That is the showcase value the
  requirements chose, and its cost.
- A private tier waits on the auth middleware being fixed, which is outside
  this decision.
- Hand-drawn charts mean axis, tick and tooltip code this repository owns. A
  fifth chart shape is the point to revisit the library question.
- The package's query functions are the boundary that keeps transcripts out,
  so a query that selects `detail` wholesale is a defect, and the marker test
  is what catches it.

## Alternatives considered

- **A separate app, `apps/eval-dashboard`.** Rejected: a second deployment
  and a second layout for the same reader, and AGENTS.md defers a second
  runnable app until it buys something.
- **A static export into the explorer.** Rejected for the dashboard; kept for
  the explorer's own "load from API" mode, which reads the same envelope.
- **A BI tool on Postgres.** Rejected: another service to run, and it cannot
  drill from a run to its trials.
- **Re-enable the auth middleware here.** Rejected as scope: the failure it
  caused is unrelated to evals, and fixing it deserves its own issue.
- **A chart library.** Rejected for v1: four shapes, and each library brings
  its own styling system to reconcile with StyleX.
- **Change `createTablePageReader` to take a pool.** Rejected: a public API
  change in `@lcabrera/server` for a need only this app has.

## References

- [`eval-history-plan.md`](../eval-history-plan.md) §8
- [ADR-128](../../../decisions/ADR-128-table-page-handlers-take-a-request-and-return-a-response.md)
