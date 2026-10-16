---
governs:
  - eval-history
---

# ADR-134 — The eval writer role is granted on the evals schema, not its owner

**Status:** Accepted

**Date:** 2026-10-06

**Issue:** [#1347](https://github.com/luciocabrera/lcabrera-stack/issues/1347)

**Amends:** [ADR-130](ADR-130-keep-eval-history-in-a-private-workspace-with-its-own-schema-and-migrator.md),
in two places. Its "Two roles" paragraph says `evals_writer` owns the schema;
here a separate migrating role owns it, and `evals_writer` is granted
privileges on it. Its "One connection variable per role" paragraph names
`EVALS_DATABASE_URL` for every writer command; here `evals:migrate` connects
through its own `EVALS_MIGRATE_DATABASE_URL`, and `EVALS_DATABASE_URL` stays
the writer's. The rest of ADR-130 stands, including the reader role, the
missing-role behaviour and the migrator, and its body keeps its original
reasoning.

**Relates to:** [#1344](https://github.com/luciocabrera/lcabrera-stack/issues/1344)
(the grants), [`docs/README.md`](../README.md) (the append-only rule that makes
this a new record rather than an edit to ADR-130)

## Context

ADR-130's "Two roles" paragraph says two things about `evals_writer` that do
not describe the same privileges. It says the role "owns the schema", and it
says `vp run evals:migrate` "grants to the roles when they exist".
[#1344](https://github.com/luciocabrera/lcabrera-stack/issues/1344)
implemented the second sentence. `EVALS_WRITER_ROLE` in
`packages/eval-history/src/migrate/migrate.constants.ts` lists the privileges,
and the migrator grants them on every run, after applying migrations.

ADR-130 also gives `EVALS_DATABASE_URL` to the writer, and `evals:migrate`
read that same variable. So in the setup ADR-130 describes, the migrator
connected as `evals_writer`, created every object as that role, and the writer
owned them all. The grants were then grants of a role to itself.

Transferring ownership after the fact means running
`alter schema evals owner to evals_writer`, plus the same for every table.
Postgres allows that only when the migrating role is a superuser or a member of
`evals_writer`. A managed host may not grant that membership. ADR-130 gives the
same constraint as its reason for not creating roles.

No current code path needs the writer to own anything. The writer inserts,
updates, selects and deletes rows. It never alters or drops a table or the
schema. The schema changes only when migrations run.

## Decision

**A separate migrating role owns the `evals` objects.** `vp run evals:migrate`
connects through `EVALS_MIGRATE_DATABASE_URL`, validated by its own Zod schema,
and does not read `EVALS_DATABASE_URL`. With the variable unset or not a
`postgres://` URL, it exits 1 naming it, before connecting. The role it
connects as creates the schema and every object in it, and so owns them.

`seed:synthetic`, which also applies the migrations, does so the same way:
it migrates and grants through `EVALS_MIGRATE_DATABASE_URL`, then inserts its
synthetic history as the writer through `EVALS_DATABASE_URL`. It needs both
variables and exits 1 naming whichever is missing. Inserting needs only the
writer's grants, so no step of the seed runs as the writer with more than
that.

**`evals_writer` is granted privileges on schema `evals` and owns no object
in it.** It connects through `EVALS_DATABASE_URL`, which ingest reads.
`EVALS_WRITER_ROLE` is the one list of what it holds:

- `usage` on schema `evals`
- `select, insert, update, delete` on all tables in schema `evals`

The writer has no `create` on the schema. With it, the writer could create
tables of its own and would own them, and ingest only reads and writes rows.
[#1346](https://github.com/luciocabrera/lcabrera-stack/pull/1346) granted
`usage, create`; this record drops `create`.

On every run, after the migrations, the migrator revokes all privileges each
granted role holds on the objects its list names, then grants the list, in
one transaction. A revoke run by the owner removes only grants recorded with
the owner as grantor, which covers grants made by the owner or by a
superuser. For those, a privilege dropped from a list is taken back on the
next run. A grant made by another role holding grant option is not touched.
A table a new migration adds is covered the run it is created.
`migrateEvals.integration.test.ts` migrates as a scratch migrating role and
asserts that the writer owns nothing in the schema, can insert, fails `alter`
and `drop` with "must be owner" and `create table` with "permission denied",
and loses a `create` granted before the run.

## Consequences

- An operator provisions the migrating role, with `create` on the database,
  in addition to `evals_writer` and `evals_reader`. Each has its own
  connection string, and neither granted role owns an object in `evals`.
- The migrator needs no role membership on any host. It grants on objects its
  own connection created, which the creating role is always allowed to do.
- `evals:migrate` connects as the role that created the `evals` objects.
  Running it as any other role is unsupported. A run that holds
  `evals_writer`'s privileges can report a grant that changed nothing, which
  [#1357](https://github.com/luciocabrera/lcabrera-stack/issues/1357) tracks.
- `evals_writer` cannot `alter` or `drop` the tables or the schema, and
  cannot create objects in it. Work that needs that goes through a migration.
- A privilege granted by hand to a granted role on schema `evals` or its
  tables, by the owner or a superuser, does not survive the next
  `evals:migrate`. One granted by a non-owner holding grant option does, and
  nothing here grants that option.
- A table created outside `evals:migrate` is not covered by the table grant
  until the next run. `all tables in schema` covers only tables that exist when
  the grant runs, and no default privileges are set.
- For a missing granted role, the migrator prints `create role ... login`
  and the grants. That statement sets no password: the operator sets the
  credential the role's connection string will carry, `EVALS_DATABASE_URL`
  for the writer. There is no
  `alter ... owner` step.

## Alternatives considered

- **Transfer ownership to `evals_writer`, as ADR-130's first sentence says.**
  Rejected: it needs the migrating role to be a member of `evals_writer`, which
  a managed host may not allow, and it buys `alter` and `drop`, which no code
  path uses.
- **Keep one variable and let the writer migrate, so it owns the objects.**
  Rejected: the role ingest runs as could then alter and drop the history, and
  the grants `EVALS_WRITER_ROLE` lists would describe nothing.
- **Keep ADR-130's wording and treat the grants as an interim step.**
  Rejected: the record and the code would keep describing different privileges,
  and nothing would decide which one is wrong.
- **Set default privileges for the migrating role on schema `evals`.**
  Not adopted: the migrator already re-grants after every migration run, which
  covers every table the migrator creates. Default privileges would only cover
  tables created some other way, and nothing creates them another way.

## References

- [ADR-130](ADR-130-keep-eval-history-in-a-private-workspace-with-its-own-schema-and-migrator.md)
- [#1344](https://github.com/luciocabrera/lcabrera-stack/issues/1344),
  [#1346](https://github.com/luciocabrera/lcabrera-stack/pull/1346),
  [#1347](https://github.com/luciocabrera/lcabrera-stack/issues/1347),
  [#1357](https://github.com/luciocabrera/lcabrera-stack/issues/1357)
- `packages/eval-history/src/migrate/migrate.constants.ts`,
  `packages/eval-history/src/migrate/evalsMigrateDatabaseEnv.schema.ts`
- [PostgreSQL: `ALTER SCHEMA`](https://www.postgresql.org/docs/current/sql-alterschema.html)
  (who may change an owner)
