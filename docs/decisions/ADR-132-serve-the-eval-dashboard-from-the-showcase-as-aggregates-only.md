---
governs:
  - showcase
---

# ADR-132 — Serve the eval dashboard from the showcase app, public and aggregate-only

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

**Every `/evals` route is public, and what it may return is set column by
column.** A route reads two kinds of thing: the `evals` schema's columns, and
the fields inside its `jsonb` columns, which follow the envelope. Both are
allow-listed, and anything not on a list is excluded.

**A text-typed column**, wherever this ADR uses the term, is one whose type
as `information_schema.columns` reports it is `text`, `character varying`
(varchar) or `character` (char, `bpchar`), or an array of any of them, which
`information_schema` reports as `data_type = 'ARRAY'` with `udt_name` `_text`,
`_varchar` or `_bpchar`. `eval_task.tags` is text-typed. The derivation of
`PUBLIC_COLUMNS`, the marker seed and the third test below all use this one
predicate, and the module exports it as `isTextTyped` so none of them restates
it.

The table below names every text-typed column of schema `evals`, allowed or
excluded. A column that is neither text-typed nor `jsonb` (an enum, timestamp,
number, boolean, uuid or identity) carries no free text and is allowed,
unless the last column of the table excludes it by name. A `jsonb` column is
never returned whole; a route reads only its fields listed further down:

| Table                  | Allowed text-typed columns                                                                            | Excluded by name                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `suite`                | `name`                                                                                                |                                                                                  |
| `eval_run`             | `project`, `suite`, `branch`, `git_sha`, `model_id`, `harness_version`, `sdk_version`, `catalog_hash` | `actor` (it identifies a person), `envelope_sha256`                              |
| `eval_subject`         | `name`                                                                                                | `path`                                                                           |
| `eval_subject_version` | `content_hash`, `first_seen_sha`                                                                      | `content` (the subject's text, a prompt for a `prompt` subject)                  |
| `eval_task`            | `suite`, `task_key`, `source`, `tags`                                                                 |                                                                                  |
| `eval_task_version`    | `task_hash`, `fixture_hash`, `expected_hash`, `judge_prompt_hash`, `agent_prompt_hash`                |                                                                                  |
| `eval_trial`           | `error_class`                                                                                         | `transcript_uri`, `transcript_sha`, `transcript_bytes`, `transcript_expires_at`  |
| `eval_trial_detail`    | `detail_schema`                                                                                       | `detail` (its fields only through the paths below)                               |
| `eval_tool_call`       | `tool`                                                                                                | `input_summary`                                                                  |
| `eval_baseline`        | `suite`, `model_id`, `metric`, `git_sha`                                                              |                                                                                  |
| `eval_annotation`      | none; `at` and `kind` are allowed, which is enough to mark a timeline                                 | `text`, `author`                                                                 |
| `eval_human_grade`     | `dimension`                                                                                           | `grader`                                                                         |
| `model_price`          | `model_id`                                                                                            |                                                                                  |
| `schema_migration`     |                                                                                                       | the whole table, through `EXCLUDED_TABLES`; no route reads the migrator's ledger |

These `jsonb` fields may be returned:

- from `eval_run.settings`, only `runs`, `concurrency`, `timeout_ms`,
  `max_turns`, `tools`, `hidden` and `selection`. `argv`, the full command
  line, is excluded by name;
- from `eval_run.env`, only `node`, `os`, `arch` and `ci_runner`;
- from `eval_run.totals`, every field, through `ALLOWED_WHOLE_JSONB` below;
- from `eval_trial_detail.detail`, only the invoked skills, the expected skill,
  the verdict, the not-met criterion numbers with the expected ones, the
  rubric dimension names with their scores, and the quality suite's
  `overall` score, which the `quality_overall` baseline is computed from.
  The quality suite's `summary` and per-dimension `feedback`, rule-check
  `findings`, and every other `detail` field are excluded.

Aggregates computed from allowed values may be returned: pass rates,
intervals, trends, flaky sets, comparisons, attributions to a changed hash,
and counts. The input hashes are allowed so a comparison can name the one
input that changed; a hash does not carry the text it was taken from. The
`.json` route serves the same projection of a run and never the stored
envelope.

**The allow-list is data, not prose and not a `SELECT` list.** One module,
`@repo/eval-history/queries`, holds it as four written lists and one derived
set:

- `EXCLUDED_TABLES` names the tables none of whose columns a route may
  return, at adoption only `schema_migration`. It removes every column of a
  named table, including `version` and `applied_at` and any column a later
  migration adds to it, so no column of that table is listed one by one.
- `EXCLUDED_COLUMNS` is the table's last column for every other row: every
  column excluded by name, text or not, including
  `eval_trial.transcript_bytes`, `eval_trial.transcript_expires_at` and
  `eval_trial_detail.detail`.
- `ALLOWED_TEXT_COLUMNS` is the table's middle column: the text-typed
  columns a route may return.
- `PUBLIC_FIELD_PATHS` is the allowed envelope paths inside the `jsonb`
  columns, written out, plus `ALLOWED_WHOLE_JSONB`: the `jsonb` columns whose
  fields all pass, at adoption only `eval_run.totals`. `totals` qualifies
  because it is a closed set of counts, rates, durations, cost and tokens that
  only the ingester writes, so it holds no free text to filter.
- `PUBLIC_COLUMNS` is built in code from the migrated schema, never written
  out. It is every column of a **base table** in schema `evals`, which is
  `information_schema.columns` joined to `information_schema.tables` where
  `table_type = 'BASE TABLE'`. From those it removes every column of a table
  in `EXCLUDED_TABLES`, `EXCLUDED_COLUMNS`, every `jsonb` column, and every
  text-typed column not in `ALLOWED_TEXT_COLUMNS`. Every number, timestamp and
  identifier the dashboard shows, such as `eval_trial.duration_ms`, the token
  counts, `eval_baseline.mean` and `stddev`, is in it without being listed.
  Views are left out, because a view's text-typed columns are not base columns and
  would otherwise be stripped.

A query function that reads base tables projects its result through
`PUBLIC_COLUMNS`, `PUBLIC_FIELD_PATHS` and `ALLOWED_WHOLE_JSONB`. A view or a
set-returning function (`v_task_pass_rate`, `v_subject_trend`, `run_compare`,
`flaky_tasks` and the rest) is governed by its definition instead. It may
select only values the projection would allow: columns in `PUBLIC_COLUMNS`,
allowed `jsonb` fields, and aggregates of them. A query that returns its
result is not projected again. The marker test checks a view or function the
same way it checks a base-table query, through the routes that read it,
because the seeded rows flow through it. No query returns `detail`,
`settings` or `env` whole for a route to filter afterwards. Adding an entry to
`ALLOWED_TEXT_COLUMNS`, `PUBLIC_FIELD_PATHS` or `ALLOWED_WHOLE_JSONB`,
removing one from `EXCLUDED_COLUMNS` or `EXCLUDED_TABLES`, or selecting a new
column in a view or function a route reads, is the change this ADR governs,
and it is reviewed against this ADR.

**How it is tested.** A marker test in the showcase enforces the rule above.
It holds no list of its own; it imports the module's sets.

1. It migrates a scratch history database, then reads `information_schema`
   for every text-typed column of a base table in schema `evals`. It
   subtracts `PUBLIC_COLUMNS` and seeds a unique marker string into every remaining column of every seeded row. A
   column that a later migration adds is therefore seeded by default. Views
   are not seeded, since they hold no rows of their own.
2. It walks the envelope's Zod schema for every **free-string field** inside
   the `jsonb` columns: a Zod string, or an array of strings, with no enum or
   literal constraint. It subtracts `PUBLIC_FIELD_PATHS` and the columns in
   `ALLOWED_WHOLE_JSONB`, and seeds the marker into each path that remains,
   `settings.argv` included. The seeded envelope still passes the Zod schema,
   so the ingest path writes it as it would a real run. A field typed as an
   enum or a literal, such as the `detail` discriminator `schema` or
   rules-consistency's `check`, is not seeded: it can only hold one of the
   values the schema names, so it carries no free text, and a marker in it
   would fail validation.
3. With the flag set, it calls the loader of every `/evals` route, and every
   resource route, with parameters that select the seeded runs, subjects and
   tasks. It asserts that each one answered 2xx, and that each result
   contains an allowed value from the seeded rows, such as the seeded run's
   `run_id` or a seeded `task_key`. A route that errors, or that answers with
   none of the seeded data, fails the test here instead of passing it with no
   marker to find.
4. It serialises each result and fails if the marker appears in any of
   them.

The test takes the set of routes from the showcase's route config, filtered to
the `/evals` prefix, so a new route is covered without a change to the test.
A test that passes proves nothing until it has failed, so the PR that adds it
must show a failing run against a query that returns `detail` whole.

A second test unsets the flag and asserts that every route in that same set
answers with 404.

A third test guards the derivation in the other direction, against the same
migrated schema and over base tables only. It asserts that every column that
is neither text-typed, `jsonb`, in `EXCLUDED_COLUMNS` nor in a table in
`EXCLUDED_TABLES` is in `PUBLIC_COLUMNS`, with `eval_trial.duration_ms` as the
named case, and that no column of `schema_migration` is in it. A set stripped
of the numbers would otherwise pass the marker test, which seeds only
text-typed columns.
It also walks the Zod schema of every column in `ALLOWED_WHOLE_JSONB` and
fails if any field is a free-string field, as step 2 defines it, so a text
field added to `totals` cannot pass whole without being decided here.

**Where they run.** All three tests run in `check-safe.yml`'s `unit-tests` job, on
the Postgres service that #1268 adds there for the history package's own
integration test. That is the rule the plan's §7.2 sets. They read
`EVALS_TEST_DATABASE_URL`, not `SMOKE_DB`, which no workflow sets. When the
variable is unset they skip with a printed reason outside CI, and they
**fail** under `CI`, so a job wired without the database cannot report green
having never run them. They reach CI through the lane `unit-tests` already
runs: `test:changed -- --ci` on a pull request, which selects the showcase
whenever it or a workspace it depends on changes, `@repo/eval-history`
included, and `test:ci` on every push to `main`.

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
- The module's sets, the query functions that project through them, and the
  definitions of the views and functions a route reads are the only thing
  keeping transcripts and prose off a route. A query that selects `detail`
  whole, skips the projection, or a view that selects an excluded column, is
  a defect, and the marker test is what catches it. An entry added to
  `ALLOWED_TEXT_COLUMNS` or `PUBLIC_FIELD_PATHS` is not seeded, so the marker
  test cannot catch a wrong addition; review against this ADR is the only
  check on it.
- A column that is not text-typed and that a later migration adds is public
  by default, because `PUBLIC_COLUMNS` is derived. That is the price of not
  listing every number by hand. Such a column that must stay private has to be added to
  `EXCLUDED_COLUMNS`, or its table to `EXCLUDED_TABLES`, in the same
  migration's PR.
- Every excluded text-typed column accepts an arbitrary string at adoption. A later
  column whose check or foreign key rejects the marker makes the seed fail, so
  it has to be decided here rather than skipped.

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
