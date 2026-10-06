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
- `src/stats/` — the statistics of
  [the plan's §6](../../docs/agents/planning/eval-history-plan.md#6-statistics-module):
  the Wilson interval, pass@k and pass^k, the baseline summary, the binary and
  scored regression rules, flaky detection, hash attribution and trigger
  precision and recall. `error`, `timeout` and `skipped` trials never count
  toward n. The thresholds are not in the code: `loadRegressionConfig` reads
  them from [`evals/regression.config.json`](../../evals/regression.config.json)
  and rejects a file that fails `regressionConfigSchema`.

`vp run evals:migrate` applies `migrations/` to the database
`EVALS_DATABASE_URL` names. Locally that is a database named `eval_history` on
the compose Postgres, created once with `create database eval_history`.

`vp run evals:ingest` reads the same variable. Every eval runner calls it on
its own envelope with `--quiet-unreachable`, so an unset variable or a database
that is down only warns, and the file waits on disk for the next
`vp run evals:ingest`.

The migrator's integration test needs `EVALS_TEST_DATABASE_URL` pointing at a
scratch database, because it drops schema `evals` there before every test.
The ingest test creates and drops a database of its own beside that one.
Without the variable both skip and say why, except under `CI`, where they fail.

The source is TypeScript with erasable syntax only, so a plain `.mjs` runner
imports it through `exports` with no build and no loader.

After changing the schema, run `vp run --filter @repo/eval-history schema:write`
and then `vp fmt .`.
