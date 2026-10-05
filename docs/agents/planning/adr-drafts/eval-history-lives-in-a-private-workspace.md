# ADR-NNN — Keep eval history in a private workspace with its own Postgres schema and migrator

**Status:** Proposed

**Governs at adoption:** `eval-history`

**Issue:** [#1262](https://github.com/luciocabrera/lcabrera-stack/issues/1262)

**Waits on:** questions 1, 2, 7 and 8 in
[`eval-history-plan.md`](../eval-history-plan.md#12-questions-for-stakeholders).
`governs` names a workspace that does not exist until #1265; `adr:verify`
will reject it if this is adopted first.

## Context

The four eval suites under `evals/` write to `.tmp/` and keep nothing. The
requirements in [`eval-history-prd.md`](../eval-history-prd.md) ask for every
run to be stored in Postgres, read by a CLI, by CI and by a dashboard, through
one data-layer package.

Three facts about this repository narrow the choice:

- `evals/` is not a workspace. It has no manifest and resolves its
  dependencies from the root.
- There is no migration tool. The showcase seed drops and recreates the
  tables each of its SQL files owns.
- Postgres access in `@lcabrera/server` goes through one pool built from the
  `DB_*` variables, and `runQuery` always uses it.

AGENTS.md §1 says a capability that serves neither the application stack nor
the repo toolchain is a signal to stop rather than to add a package. Eval
history serves neither: it measures the skills, rules and agent prompts this
repository is maintained with.

## Decision

**A private workspace, `packages/eval-history`, named `@repo/eval-history`.**
`private: true`, no changeset, and its `.gitignore` does not cover
`eslint-suppressions.json`, so `vp run suppressions:packages` does not list
it. It owns the envelope schema, hashing, statistics, migrations, ingest and
the read queries. The runners under `evals/`, the CI jobs and the showcase
import it; the root manifest declares it for the runners.

**TypeScript with erasable syntax only.** The `.mjs` runners import its
source directly, which works because Node strips types from a file whose real
path is outside `node_modules`. A test imports one entry from a plain `.mjs`
file so a runtime that refuses fails CI.

**One connection variable per role.** `EVALS_DATABASE_URL` for the writer
(CLI and CI), `EVALS_READER_DATABASE_URL` for the showcase. Both are validated
by a Zod schema in the package, and the package builds its own `pg` pool from
them. It does not use `getPool()`.

**Schema `evals`, in a database of its own locally.** On the compose Postgres
that is a database named `eval_history`, which the showcase seed cannot drop.
In CI it is the hosted database question 2 chooses; until a secret exists, CI
ingest skips.

**Two roles.** `evals_writer` owns the schema. `evals_reader` has `USAGE` on
the schema and `SELECT` on its tables and views, and nothing else. Creating
roles needs a privilege some hosts withhold, so `vp run evals:migrate` grants
to the roles when they exist and prints the `CREATE ROLE` statements when
they do not.

**A migrator in the package.** Ordered `migrations/NNNN-<slug>.sql` files,
each applied in its own transaction under a fixed advisory lock, recorded in
`evals.schema_migration` with a SHA-256. A changed applied file stops the run
and names the file. There are no down migrations.

## Consequences

- A repository-internal package exists against AGENTS.md §1's default. The
  cost is a workspace to keep under every per-workspace gate, for a consumer
  that is this repository alone.
- The migrator is code this repository maintains. It is small, and it can
  never do what a mature tool does: no down migrations, no generated diffs,
  no squashing.
- Two connection strings, two roles and a separate local database are more
  setup than reusing the showcase's `DB_*` variables. A developer who never
  runs `evals:migrate` still runs every suite, because ingest warns and the
  envelope stays on disk.
- `@lcabrera/server` stays unchanged, so the showcase's table-page reader
  cannot read eval tables (see the dashboard draft).

## Alternatives considered

- **`node-pg-migrate`.** Rejected: a new dependency and a JavaScript migration
  DSL for a schema whose whole history is a handful of SQL files. Reviewing
  plain SQL in a PR is the property that matters, and the in-package migrator
  keeps it.
- **Drop-and-recreate like the showcase seed.** Rejected: the data is the
  history; dropping it is the one thing this package exists not to do.
- **Store history in the showcase database's `public` schema.** Rejected: the
  seed drops tables there, and the app's credentials would be able to write
  eval data.
- **Keep everything in `evals/` with a JSON store.** Kept as the fallback if
  question 8 is answered no. It serves Phases 1 and 2 without a database and
  rules out the dashboard.
- **`@lcabrera/` scope.** Rejected: the package does not ship, and ADR-040
  makes the scope say whether it does.

## References

- [`eval-history-prd.md`](../eval-history-prd.md), [`eval-history-plan.md`](../eval-history-plan.md) §3, §4
- [ADR-040](../../../decisions/ADR-040-npm-scope-for-the-public-packages.md)
- [ADR-047](../../../decisions/ADR-047-declare-optional-peer-dependencies.md)
