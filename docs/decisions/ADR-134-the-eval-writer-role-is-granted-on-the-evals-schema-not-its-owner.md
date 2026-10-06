---
governs:
  - eval-history
---

# ADR-134 — The eval writer role is granted on the evals schema, not its owner

**Status:** Accepted

**Date:** 2026-10-06

**Issue:** [#1347](https://github.com/luciocabrera/lcabrera-stack/issues/1347)

**Amends:** [ADR-130](ADR-130-keep-eval-history-in-a-private-workspace-with-its-own-schema-and-migrator.md).
Its "Two roles" paragraph says `evals_writer` owns the schema. The accurate
statement is that `evals_writer` is granted privileges on it and does not own
it. The rest of ADR-130 stands, including the reader role, the missing-role
behaviour and the migrator, and its body keeps its original reasoning.

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
Ownership is never transferred.

Transferring it means running `alter schema evals owner to evals_writer`, plus
the same for every table. Postgres allows that only when the migrating role is
a superuser or a member of `evals_writer`. A managed host may not grant that
membership. ADR-130 gives the same constraint as its reason for not creating
roles.

No current code path needs ownership. The writer inserts, updates, selects and
deletes rows. It never alters or drops a table or the schema, and only the
migrator changes the schema.

## Decision

**`evals_writer` is granted privileges on schema `evals` and does not own it.**
`EVALS_WRITER_ROLE` is the one list of what it holds:

- `usage, create` on schema `evals`
- `select, insert, update, delete` on all tables in schema `evals`

The schema and its tables are owned by whichever role `vp run evals:migrate`
connects as through `EVALS_DATABASE_URL`, because that role creates them. When
that connection is itself `evals_writer`, the role owns what it created. That
ownership comes from the connection, not from anything the migrator does.

The migrator re-applies the grants on every run, after the migrations, so a
table a new migration adds is covered the run it is created.

## Consequences

- The migrator needs no role membership on any host. It grants on objects its
  own connection created, which the creating role is always allowed to do.
- `evals_writer` cannot `alter` or `drop` the tables or the schema unless it is
  also the role the migrator connects as. Work that needs that goes through a
  migration.
- A table created outside `evals:migrate` is not covered by the table grant
  until the next run. `all tables in schema` covers only tables that exist when
  the grant runs, and no default privileges are set.
- The `create role` and `grant` statements the migrator prints for a missing
  role are the full setup. An operator has no `alter ... owner` step to run.

## Alternatives considered

- **Transfer ownership to `evals_writer`, as ADR-130's first sentence says.**
  Rejected: it needs the migrating role to be a member of `evals_writer`, which
  a managed host may not allow, and it buys `alter` and `drop`, which no code
  path uses.
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
  [#1347](https://github.com/luciocabrera/lcabrera-stack/issues/1347)
- `packages/eval-history/src/migrate/migrate.constants.ts`
- [PostgreSQL: `ALTER SCHEMA`](https://www.postgresql.org/docs/current/sql-alterschema.html)
  (who may change an owner)
