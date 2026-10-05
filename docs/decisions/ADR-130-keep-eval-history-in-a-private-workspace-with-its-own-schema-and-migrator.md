---
governs:
  - repository
---

# ADR-130 — Keep eval history in a private workspace with its own Postgres schema and migrator

**Status:** Accepted

**Issue:** [#1262](https://github.com/luciocabrera/lcabrera-stack/issues/1262)

**Epic:** [#1260](https://github.com/luciocabrera/lcabrera-stack/issues/1260)

`governs` is `repository`: this ADR is adopted before `packages/eval-history`
exists (#1265), so `adr:verify` would reject the workspace name, and the
decision is about this repository's own tooling in any case.

## Context

The eval suites under `evals/` (rules-consistency, skills, verifier-fixtures,
the tooled verifier and skill-quality) write to `.tmp/` and keep nothing. The
requirements in
[`eval-history-prd.md`](../agents/planning/eval-history-prd.md) ask for every
run to be stored in Postgres, read by a CLI, by CI and by a dashboard, through
one data-layer package, with schema changes going through "the stack's
existing migration tool".

Three facts about this repository narrow the choice:

- `evals/` is not a workspace. It has no manifest and resolves its
  dependencies from the root.
- There is no migration tool. The showcase seed drops and recreates the
  tables each of its SQL files owns, and no catalog in `pnpm-workspace.yaml`
  declares a migration library. The tool the PRD expects to reuse does not
  exist, so the choice is between adding one and writing one.
- Postgres access in `@lcabrera/server` goes through one pool built from the
  `DB_*` variables, and `runQuery` always uses it.

AGENTS.md §1 says a capability that serves neither the application stack nor
the repo toolchain is a signal to stop rather than to add a package. Eval
history serves neither: it measures the skills, rules and agent prompts this
repository is maintained with.

The plan's stakeholder questions 1, 2, 7 and 8
([`eval-history-plan.md` §12](../agents/planning/eval-history-plan.md#12-questions-for-stakeholders))
were answered on the epic on 2026-10-05. The decision below records those
answers:

- **Question 1:** history lives locally in a separate `eval_history` database
  on the existing compose Postgres, schema `evals`.
- **Question 2:** no hosted Postgres provider is chosen yet.
- **Question 7:** no MCP tool for coding agents in v1.
- **Question 8:** proceed despite the §1 stop signal, as a private
  `@repo/eval-history` workspace that never ships.

## Decision

**A private workspace, `packages/eval-history`, named `@repo/eval-history`.**
`private: true`, no changeset, and its `.gitignore` does not cover
`eslint-suppressions.json`, so `vp run suppressions:packages` does not list
it. It owns the envelope schema, hashing, statistics, migrations, ingest and
the read queries. The runners under `evals/`, the CI jobs and the showcase
import it; the root manifest declares it for the runners. It is the exception
to AGENTS.md §1's stop signal: the history measures the agent setup both
products are built with, and the `@repo/` scope says it never ships.

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
It shares the container and nothing else.

**No hosted Postgres provider is named, and CI ingest stays off until one is
chosen.** History is local Postgres plus CI artifacts. The CI ingest step
reads an `EVALS_DATABASE_URL` secret; while that secret is absent it skips
with a notice and the job still passes. Adding the secret, pointing at a
Postgres reachable from GitHub Actions, switches ingest on with no code
change. Choosing the provider means an account and a credential, so a human
does it, and it needs no new ADR unless it changes something decided here.

**Two roles.** `evals_writer` owns the schema. `evals_reader` has `USAGE` on
the schema and `SELECT` on its tables and views, and nothing else. Creating
roles needs a privilege some hosts withhold, so `vp run evals:migrate` grants
to the roles when they exist and prints the `CREATE ROLE` statements when
they do not, exiting 0.

**The migrator is written in the package, not reused.** Ordered
`migrations/NNNN-<slug>.sql` files, each applied in its own transaction under
a fixed advisory lock, recorded in `evals.schema_migration` with a SHA-256. A
changed applied file stops the run and names the file. There are no down
migrations. It runs over `pg`, which `catalog:backend` already provides, so it
adds no dependency.

**No MCP server in v1.** `vp run evals:report` answers an agent's question
about a skill's history from a shell. An MCP tool would be a second read
interface to keep in step with the CLI.

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
- Until a provider is chosen, CI runs add nothing to the history. Their
  envelopes exist only as artifacts and expire with them, so a trend across
  CI runs waits on the secret.
- `@lcabrera/server` stays unchanged, so the showcase's table-page reader
  cannot read eval tables; the dashboard reads through this package.
- An agent that wants history runs a command instead of calling a tool.

## Alternatives considered

- **`node-pg-migrate`.** Rejected: a new dependency and a JavaScript migration
  DSL for a schema whose whole history is a handful of SQL files. Reviewing
  plain SQL in a PR is the property that matters, and the in-package migrator
  keeps it.
- **Reuse the showcase seed's drop-and-recreate.** Rejected: it is the only
  schema tool in the repository, and it destroys data. The data is the
  history; dropping it is the one thing this package exists not to do.
- **Store history in the showcase database's `public` schema.** Rejected: the
  seed drops tables there, and the app's credentials would be able to write
  eval data.
- **Keep everything in `evals/` with a JSON store.** Rejected once question 8
  was answered yes. It would have served the run and compare phases without a
  database, and it rules out the dashboard.
- **Name a free-tier serverless Postgres now.** Rejected: it is an account and
  a credential no agent can create, and naming a provider nobody holds would
  read as a step already taken.
- **An MCP tool for agents in v1.** Rejected with question 7: the CLI already
  answers the question.
- **`@lcabrera/` scope.** Rejected: the package does not ship, and
  [ADR-040](./ADR-040-npm-scope-for-the-public-packages.md) makes the scope say
  whether it does.

## References

- [`eval-history-prd.md`](../agents/planning/eval-history-prd.md),
  [`eval-history-plan.md`](../agents/planning/eval-history-plan.md) §3, §4, §12
- Stakeholder answers: [#1260](https://github.com/luciocabrera/lcabrera-stack/issues/1260)
- [ADR-038](./ADR-038-public-package-topology-by-runtime.md)
- [ADR-040](./ADR-040-npm-scope-for-the-public-packages.md)
- [ADR-047](./ADR-047-declare-optional-peer-dependencies.md)
