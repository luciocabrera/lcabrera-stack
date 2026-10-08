# `@repo/eval-history`

The private workspace that records eval runs:
[ADR-130](../../docs/decisions/ADR-130-keep-eval-history-in-a-private-workspace-with-its-own-schema-and-migrator.md)
decides why it exists and why it never ships, and
[ADR-131](../../docs/decisions/ADR-131-version-the-eval-run-envelope-and-accept-the-previous-version.md)
decides how the envelope is versioned.

- `src/envelope/` — the run envelope as a Zod schema, the validator, the
  emitted `envelope.schema.json`, and one example envelope per suite under
  `fixtures/`.
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
  on `run_id`, so a run already stored is left alone.
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
whatever else that role holds on the same objects, so the lists are exactly
what each role ends up with. The writer gets `usage` on schema `evals`, with no
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
The ingest test and the reporting test each create and drop a database of
their own on the same server. The reporting test seeds the synthetic year into
its database and times every query with `EXPLAIN ANALYZE` against a 500 ms
budget. Without the variable all three skip and say why, except under `CI`,
where they fail.

`vp run --filter @repo/eval-history seed:synthetic` migrates the database
`EVALS_DATABASE_URL` names and writes the synthetic year into it. It refuses a
database that already holds a run, so point it at an empty one, never at the
history you keep.

The source is TypeScript with erasable syntax only, so a plain `.mjs` runner
imports it through `exports` with no build and no loader.

After changing the schema, run `vp run --filter @repo/eval-history schema:write`
and then `vp fmt .`.
