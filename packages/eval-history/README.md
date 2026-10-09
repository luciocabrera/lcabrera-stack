# `@repo/eval-history`

The private workspace that records eval runs:
[ADR-130](../../docs/decisions/ADR-130-keep-eval-history-in-a-private-workspace-with-its-own-schema-and-migrator.md)
decides why it exists and why it never ships, and
[ADR-131](../../docs/decisions/ADR-131-version-the-eval-run-envelope-and-accept-the-previous-version.md)
decides how the envelope is versioned.

- `src/annotations/` — a timeline note in `evals.eval_annotation`: its kinds,
  its schema and the insert `evals:annotate` runs.
- `src/envelope/` — the run envelope as a Zod schema, the validator, the
  emitted `envelope.schema.json`, and one example envelope per suite under
  `fixtures/`. A skill-quality trial whose detail names no `judge_model`,
  whose task carries no `judge_prompt_hash`, or whose dimension scores are not
  whole numbers from 1 to 5 on distinct dimensions, fails the run schema.
- `src/grades/` — hand grades of the quality judge: recording one against the
  dimensions the judge scored on that trial, reading
  `evals.v_judge_agreement`, and the agreement rate `evals:grade` prints.
- `src/hashing/` — the input hashes of
  [the plan's §5](../../docs/agents/planning/eval-history-plan.md#5-hashing):
  normalized content hashes, the multi-file hash, canonical JSON, the skill
  catalog hash and the harness version.
- `src/migrate/` and `migrations/` — the migrator ADR-130 decides and the
  ordered SQL files it applies. A fix to an applied file is a new file: the
  migrator refuses to run while an applied one has changed.
- `src/ingest/` — the ingester behind `vp run evals:ingest`: it finds
  envelopes under the paths it is given, brings one written a version earlier
  up to date through its upcaster in `ENVELOPE_UPCASTERS` and rejects any
  other version by name (ADR-131), and stores each run in one transaction keyed
  on `run_id`, so a run already stored is left alone. A skill-quality trial's
  judge model and dimension scores go into their own columns in the statement
  that inserts the trial.
- `src/prices/` — the schema of `model-prices.json` and its upsert into
  `evals.model_price`.
- `src/queries/` — the read functions the dashboard calls, one per reporting
  view or function of `migrations/0002-reporting.sql`: `readTaskPassRates`
  (`evals.v_task_pass_rate`), `readSubjectTrend` (`evals.v_subject_trend`),
  `readFlakyTasks` (`evals.flaky_tasks(run_window)`, the plan's `v_flaky_tasks`, a
  function so the window comes from `evals/regression.config.json`) and
  `readRunComparison` (`evals.run_compare(a, b)`). Each builds its SQL in a
  pure `*Query.util.ts`, so a test can read what is sent, and none of them, nor
  the views beneath, names a column in `EXCLUDED_COLUMNS`
  ([ADR-133](../../docs/decisions/ADR-133-serve-the-eval-dashboard-from-the-showcase-as-aggregates-only.md)).
  `readRunSummaries` and `readRunTrials` read base tables instead, and reach
  each one only through `projectedRelation`, which refuses a column outside
  `PUBLIC_COLUMNS` (derived per read from `information_schema` by
  `readPublicColumns`) and a `jsonb` field outside `PUBLIC_FIELD_PATHS`.
  `evalsReaderPool` is the pool they run on, built from
  `EVALS_READER_DATABASE_URL`.
- `src/seed/` — a year of synthetic nightly history, about 15k trials, for
  timing the views and building the dashboard against real volume.
- `src/stats/` — the statistics of
  [the plan's §6](../../docs/agents/planning/eval-history-plan.md#6-statistics-module):
  the Wilson interval, pass@k and pass^k, the baseline summary, the binary and
  scored regression rules, flaky detection, hash attribution and trigger
  precision and recall. `error`, `timeout` and `skipped` trials never count
  toward n. The thresholds are not in the code: `loadRegressionConfig` reads
  them from [`evals/regression.config.json`](../../evals/regression.config.json)
  and rejects a file that fails `regressionConfigSchema`.
- `src/testing/` — the scratch-database harness the integration tests share:
  it connects to databases beside the one `EVALS_TEST_DATABASE_URL` names and
  drops them, and the roles a test created, afterwards. `markedEnvelopes`
  builds one schema-valid envelope per suite with a marker in every field the
  allow-list leaves out, for the showcase's `/evals` public-payload test. No
  command imports either.

`vp run evals:migrate` applies `migrations/` to the database
`EVALS_MIGRATE_DATABASE_URL` names, connected as the migrating role, which
needs `create` on that database and owns every object it creates. It does not
read `EVALS_DATABASE_URL`, which is `evals_writer`'s and is what ingest uses;
with only that one set, the run exits 1 naming the missing variable
([ADR-134](../../docs/decisions/ADR-134-the-eval-writer-role-is-granted-on-the-evals-schema-not-its-owner.md)).
Locally that is a database named `eval_history` on the compose Postgres,
created once with `create database eval_history`.

Every run then upserts [`model-prices.json`](./model-prices.json) into
`evals.model_price`, keyed on `modelId` and `validFrom`. Take the prices from
the page `source` names. A price that changes from a new date is a new entry
with that `validFrom`, so the old rows still cost the runs before it; changing
the numbers of an existing entry corrects that row in place. `src/prices/`
holds the schema the file must pass.

Last, it grants `evals_writer` and `evals_reader` the privileges
`EVALS_WRITER_ROLE` and `EVALS_READER_ROLE` list, in
`src/migrate/migrate.constants.ts`, to each role that exists, after revoking
whatever else the owner granted that role on the same objects, so for grants
made by the owner or a superuser the lists are exactly what each role ends up
with. A grant made by a non-owner holding grant option is left alone. The writer gets `usage` on schema `evals`, with no
`create`, and DML on its tables. The reader gets `usage` on schema `evals` and
`select` on its tables and views, and nothing else: it is the role the
dashboard connects as. When a role does not exist,
the run prints the `create role` and `grant` statements and still exits 0:
creating a role needs a privilege some hosts withhold, so that step is the
operator's. The printed `create role` sets no password; set the credential
the role's connection string will carry, `EVALS_DATABASE_URL` for the writer.
Neither role owns anything in schema `evals` or can create in it, so neither
can alter or drop what the migrating role created.

`vp run evals:ingest` reads `EVALS_DATABASE_URL` and connects as
`evals_writer`. Every eval runner calls it on
its own envelope with `--quiet-unreachable`, so an unset variable or a database
that is down only warns, and the file waits on disk for the next
`vp run evals:ingest`.

The migrator's integration test needs `EVALS_TEST_DATABASE_URL` pointing at a
scratch database, because it drops schema `evals` there before every test.
The ingest, reporting and grade tests each create and drop a database of
their own on the same server. The reporting test seeds the synthetic year into
its database and times every query with `EXPLAIN ANALYZE` against a 500 ms
budget. Without the variable every one of them skips and says why, except
under `CI`, where they fail.

`vp run --filter @repo/eval-history seed:synthetic` migrates and grants
through `EVALS_MIGRATE_DATABASE_URL`, as `evals:migrate` does, then writes the
synthetic year as the writer through `EVALS_DATABASE_URL`. It needs both and
exits 1 naming whichever is missing. It refuses a
database that already holds a run, so point it at an empty one, never at the
history you keep.

## Grading the judge

`migrations/0003-grades-and-annotations.sql` adds `evals.eval_judge_score`,
the judge's 1-5 score per trial and rubric dimension, and a `judge_model`
column on `evals.eval_trial_detail`. Ingest fills both from a skill-quality
trial's `detail` in the statement that inserts the trial, and a check keeps
`judge_model` equal to the model the `detail` names. It also adds
`evals.eval_human_grade`, one score from 1 to 5 per judged dimension and
grader, whose key references the judge score it grades and is deleted with it,
so a grade can only exist beside a judge score. `evals.v_judge_agreement` puts
each hand grade next to that judge score, with the judge model and the judge
prompt hash of the trial's task version, and reads no field of `detail`. The
database refuses a skill-quality trial detail without a `judge_model`, and one
whose task version has no `judge_prompt_hash`, so every judged trial says which
judge produced it.

On a database that already holds quality trials, 0003 fills `judge_model`
and `eval_judge_score` from each trial's `detail` before it adds the
constraints. It first checks every quality trial, and when one names no
`judge_model`, has no judge prompt hash on its task version, scores a
dimension outside the whole numbers 1 to 5 or scores one twice, it stops with
the trial's id and the reason, leaving the database at 0002. Fix that row,
then run `vp run evals:migrate` again.

`vp run evals:grade -- --trial <id> --score <dimension>=<1-5> [--score ...]`
records a grade; a grader who grades the same dimension again replaces their
earlier score. It accepts only a trial with judge scores and only the
dimensions the judge scored there, and when no `--score` is given it lists
them without showing the judge's scores. The grader is `--grader`, else the
GitHub actor, else the local part of git's `user.email`.

`evals:grade` and `evals:annotate` read `EVALS_DATABASE_URL` and connect as
`evals_writer`; the `select`, `insert` and `update` that role holds on the
tables are all they need. The judge-pin trigger runs as the writing role and
reads only `evals.eval_trial` and `evals.eval_task_version`.

Agreement is the share of graded scores equal to the judge's, reported per
judge model and judge prompt hash, because a change to either is a different
judge. It carries n and its Wilson interval at the `z` and `minTrialsForRate`
in [`evals/regression.config.json`](../../evals/regression.config.json), and
says "insufficient data" below that floor; the mean absolute gap between the
two scores is printed beside it. `evals:grade` prints it after recording, and
`vp run evals:grade -- --agreement` prints it alone.

`vp run evals:annotate -- --kind <kind> "<text>"` records a timeline note —
`model-change`, `harness-change`, `incident` or `note` — at `--at`, or now.

The source is TypeScript with erasable syntax only, so a plain `.mjs` runner
imports it through `exports` with no build and no loader.

After changing the schema, run `vp run --filter @repo/eval-history schema:write`
and then `vp fmt .`.
