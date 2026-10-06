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

The migrator's integration test needs `EVALS_TEST_DATABASE_URL` pointing at a
scratch database, because it drops schema `evals` there before every test.
Without the variable it skips and says why, except under `CI`, where it fails.

The source is TypeScript with erasable syntax only, so a plain `.mjs` runner
imports it through `exports` with no build and no loader.

After changing the schema, run `vp run --filter @repo/eval-history schema:write`
and then `vp fmt .`.
