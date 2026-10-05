---
governs:
  - showcase
---

# ADR-131 — Serve the eval dashboard from the showcase app, public and aggregate-only

**Status:** Accepted

**Issue:** [#1264](https://github.com/luciocabrera/lcabrera-stack/issues/1264)

## Context

The eval-history requirements recommend an `/evals` feature in the showcase
app, behind a feature flag, with transcripts behind auth. The showcase is
missing four things that recommendation assumes:

- **A working login guard.** `apps/showcase/src/auth/authMiddleware.ts`
  exists and no route applies it. The note in
  `apps/showcase/src/routes/enterprise-orders/root.ts` says it broke
  client-side navigation.
- **A feature-flag mechanism.** The only switch is the build-time
  `VITE_API_URL`.
- **A chart library.** No manifest and no lockfile entry has one.
- **A table reader for a second database.** `createTablePageReader` in
  `@lcabrera/server` reads through `getPool()`, which is built from the
  `DB_*` variables.

Two stakeholder questions in
[`eval-history-plan.md`](../agents/planning/eval-history-plan.md#12-questions-for-stakeholders)
were left to this decision. Their answers are recorded on the epic,
[#1260](https://github.com/luciocabrera/lcabrera-stack/issues/1260):

- **Question 3, is `/evals` public?** Yes. Every route is public and serves
  aggregates and task names only. There is no private tier in v1, and the flag
  is off by default in every deployment.
- **Question 4, where do transcripts live?** In CI artifacts only, kept for
  at most 90 days, which is the longest GitHub keeps an artifact. The
  requirements also said that transcripts from main and from baseline runs are
  kept for good. That is dropped for v1, because artifacts cannot do it and
  object storage would add a provider and a credential.

## Decision

**`/evals` lives in the showcase.** Each route has its own folder under the
showcase's routes directory, and every route reads through the private
`@repo/eval-history` workspace using a database role that can only `SELECT`.

**Every `/evals` route is public, and this is all a route may return:**

- names and identifiers: suite, task, subject (skill or rule) and its version,
  run, trial, branch and commit;
- a run's settings and environment;
- each trial's outcome, error class, timestamps, duration, turns, token counts
  and cost;
- aggregates computed from the rows above, such as pass rates, intervals,
  trends, flaky sets, comparisons and counts;
- from a trial's `detail`, only these fields: the invoked skills, the expected
  skill, the verdict, the not-met criterion numbers with the expected ones, and
  the rubric dimension names with their scores.

A route returns nothing outside that list. That excludes transcript text,
prompt text, judge replies, the transcript pointer (`uri`, hash, size), the
quality suite's `summary` and per-dimension `feedback`, rule-check `findings`,
and any `detail` field the list does not name. The `.json` route serves the
same allow-listed projection of a run and never the stored envelope.

The allow-list lives in the query functions of `@repo/eval-history`. No query
returns `detail` whole for a route to filter afterwards.

**How it is tested.** One showcase test enforces the rule above:

1. It seeds the history database with a unique marker string in every field
   the list excludes: every free-text `detail` field of every suite, the
   transcript pointer, and every other `detail` field outside the list.
2. With the flag set, it calls the loader of every `/evals` route, and every
   resource route, for the seeded runs. It serialises each result.
3. It fails if the marker appears in any serialised result.

The test takes the set of routes from the showcase's route config, filtered to
the `/evals` prefix, so a new route is covered without a change to the test.
A test that passes proves nothing until it has failed, so the PR that adds it
must show a failing run against a query that returns `detail` whole.

A second test unsets the flag and asserts that every route in that same set
answers with 404.

**The flag is `EVALS_DASHBOARD=1`.** It is a server variable read by one helper
that every `/evals` loader calls. When it is unset, the loader throws a 404
`Response`. It has no `VITE_` prefix, so it never reaches the client bundle.

**Tables use `TableRouteView`.** They are fed by `createTableRouteLoader` with
a `fetchPage` that the workspace implements, not by `createTablePageReader`.

**Charts are SVG drawn with StyleX.** The sparkline, the trend with bands, the
heatmap and the matrix are small, fixed shapes.

## Consequences

- Anyone who can see a deployment with the flag on can see low or noisy
  scores, with only the context the page gives. The requirements chose that as
  the showcase's value, and this is what it costs.
- A trial cannot link to its transcript. To read one, a person with access to
  the repository opens the CI run's artifacts, and only until they expire.
- A baseline run's transcripts expire like any other. If a regression
  investigation needs a transcript older than 90 days, it is gone.
- A private tier has to wait for the auth middleware to be fixed. That fix is
  outside this decision.
- Drawing the charts by hand means this repository owns axis, tick and tooltip
  code. A fifth chart shape is the point to revisit the library question.
- The query functions are the only thing keeping transcripts and prose off a
  route. A query that selects `detail` whole is a defect, and the marker test is
  what catches it. Adding a field to the allow-list is a change to this ADR,
  not just to a query.

## Alternatives considered

- **A separate dashboard app.** Rejected. It would be a second deployment,
  a second layout and a second runnable app for the same reader.
- **A static export into the explorer.** Rejected for the dashboard. Kept for
  the explorer's own "load from API" mode, which reads the same envelope.
- **A BI tool on Postgres.** Rejected. It is another service to run, and it
  cannot drill down from a run to its trials.
- **Re-enable the auth middleware here and keep transcripts behind it.**
  Rejected as scope. The failure the middleware caused is unrelated to evals,
  and fixing it needs its own issue.
- **Keep main and baseline transcripts in object storage.** Rejected for v1.
  It adds a provider and a credential for files nobody has yet asked to read
  after 90 days.
- **A chart library.** Rejected for v1. There are four shapes, and each library
  brings its own styling system that would have to be reconciled with StyleX.
- **Change `createTablePageReader` to take a pool.** Rejected. It would change
  the public API of `@lcabrera/server` for a need no other consumer has
  raised, and `createTableRouteLoader` in `@lcabrera/ui` already accepts any
  `fetchPage`.

## References

- [`eval-history-plan.md`](../agents/planning/eval-history-plan.md) §8 and §12
- [`eval-history-prd.md`](../agents/planning/eval-history-prd.md)
- Stakeholder answers on
  [#1260](https://github.com/luciocabrera/lcabrera-stack/issues/1260)
- [ADR-128](./ADR-128-table-page-handlers-take-a-request-and-return-a-response.md)
