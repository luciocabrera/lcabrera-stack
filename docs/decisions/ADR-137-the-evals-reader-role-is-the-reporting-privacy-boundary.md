---
governs:
  - eval-history
---

# ADR-137 — The evals reader role's column privileges are the reporting privacy boundary

**Status:** Accepted

**Date:** 2026-10-18

**Issue:** [#1366](https://github.com/luciocabrera/lcabrera-stack/issues/1366)

**Amends:** [ADR-133](ADR-133-serve-the-eval-dashboard-from-the-showcase-as-aggregates-only.md),
where it says a view or set-returning function "is governed by its definition
instead", and the "Two roles" paragraph of
[ADR-130](ADR-130-keep-eval-history-in-a-private-workspace-with-its-own-schema-and-migrator.md),
which gives `evals_reader` `SELECT` on every table and view of schema `evals`.

## Context

ADR-133 lets a reporting view or function return only public values, and
checks that by reading its definition. The test read
`information_schema.view_column_usage` for the views and searched the
function bodies for the names of excluded columns. `evals_reader` held
`select` on every table in schema `evals`, so the definition check was the
only thing between a reporting relation and excluded data.

Probe migrations run against PostgreSQL 18 during the review of #1359 read
excluded data and passed that check:

- a whole-row reference, such as `to_jsonb(grade.*) ->> 'grader'` or
  `to_jsonb(trial.*) ->> 'transcript_uri'`, including one through a join alias.
  `view_column_usage` lists no column for a whole-row read;
- a whole row, or dynamic SQL, inside the body of a function in
  `REPORTING_RELATIONS`;
- a view calling a function with the same name in another schema, whose body
  the check never read;
- `query_to_xml('select transcript_uri, actor from ...')`, where the column
  names sit inside a string and `pg_depend` records nothing;
- a view over `evals.schema_migration`, which the view check did not cover.

A parser for deparsed SQL kept failing review on new forms, and no parser can
see a query that is built at run time.

## Decision

**Postgres refuses excluded data to `evals_reader`, and the test checks the
privileges rather than the definitions.**

`evals_reader` holds `usage` on schema `evals`, `select` on every view in
it, and column-level `select` on the **reader columns** of each base table and
nothing else. The reader columns, `readerColumns` in
`src/queries/readerColumns.util.ts`, are `PUBLIC_COLUMNS`, the columns in
`ALLOWED_WHOLE_JSONB`, and the public copies below. No column of a table in
`EXCLUDED_TABLES` is one of them, so the reader holds nothing on
`schema_migration`.

`EVALS_READER_ROLE` names two targets the migrator resolves after applying
the migrations: `all views in schema evals` and
`public columns in schema evals`. `resolveGrants` turns them into one grant per
view and one column grant per table. Before granting, the migrator revokes
everything the reader holds on every table and view in the schema, so a
deployment that granted `select` on all tables loses it on the next
`evals:migrate`. It then checks each view grant with `has_table_privilege` and
each column with `has_column_privilege`.

**Every view in `evals` runs with the caller's privileges**
(`security_invoker = true`), and no function is `security definer`, which is
the Postgres default. A reporting relation therefore reads with the reader's
privileges, and each of the forms above fails with `42501`:

- a whole-row reference needs `select` on every column of its table, and every
  table with an excluded column has at least one the reader lacks;
- a function body, static or dynamic, runs as the reader;
- `query_to_xml` runs its query as the reader;
- a function in another schema runs as the reader unless it is
  `security definer`, which the test rejects;
- the reader holds nothing on `schema_migration`.

**The allowed `jsonb` fields live in stored generated copies.** Column
privileges cannot reach inside a `jsonb` value, so `eval_run.settings`,
`eval_run.env` and `eval_trial_detail.detail` stay unreadable, and migration
`0004-reader-boundary.sql` adds `settings_public`, `env_public` and
`detail_public`. Each is
`json_object(... absent on null returning jsonb)` over the top-level fields
`PUBLIC_FIELD_PATHS` allows for its source. `PUBLIC_JSONB_COLUMNS` maps each
source to its copy, and `projectedRelation` reads a field from the copy.
`json_object` is used because `jsonb_build_object` is not immutable and a
generation expression must be. A field reached through an array element,
such as `detail.dimensions[].score`, is not copied; scores are served from
`eval_judge_score`.

**What the test asserts.** `src/queries/readerBoundary.integration.test.ts`
migrates a scratch database and checks, across every non-system schema:

1. the columns `evals_reader` can select are exactly the reader columns and
   the columns of the views in `evals`;
2. no view the reader can select lacks `security_invoker`;
3. no function the reader can execute is `security definer`;
4. each public copy is generated, and its expression deparses the same as
   the one `publicFieldsExpression` builds from `PUBLIC_FIELD_PATHS`.

It then runs one probe per form listed in the context, each inside a
transaction it rolls back. A probe either replaces `evals.v_subject_trend` or
replaces the body of `evals.flaky_tasks`, then asserts that the reader's query
fails with `42501`, or, for the variant that runs with the owner's
privileges, that the second or third check names it. It also runs the
dashboard's and the CLI's readers as the reader.

The definition checks in `reporting.integration.test.ts` stay. They still name
an excluded column a view or function selects directly, but they no longer
carry the boundary.

## Consequences

- A migration that creates or replaces a view in `evals` must give it
  `security_invoker = true`. `create view` defaults to the owner's privileges,
  and a view created without it fails check 2.
- Adding a top-level path to `PUBLIC_FIELD_PATHS` changes the expected
  expression, so check 4 fails until a migration rewrites the copy to match.
  Removing a path works the same way.
- The copies duplicate part of three `jsonb` columns in storage, and adding
  them rewrote both tables once.
- The reader cannot `select *` from a base table, and `information_schema` shows
  it only the columns it holds. A dashboard query that names a source `jsonb`
  column, or any column outside the reader columns, fails at run time instead
  of returning it.
- Running `evals:migrate` as a role that cannot see every column in
  `information_schema` resolves fewer reader columns. ADR-134 already makes
  running as any role but the owner unsupported.
- The reader's privileges are now the boundary for anything that connects as
  `evals_reader`, not only for the reporting relations. The writer still reads
  every column; the CLI reads through `EVALS_DATABASE_URL`, and its queries
  also run as the reader in the test above.

## Alternatives considered

- **Keep checking definitions and close each form in the parser.** Rejected:
  the forms in the context are the ones review found, not all of them, and a
  query built at run time is invisible to any reader of the definition.
- **Expose the allowed `jsonb` fields through views that run with the owner's
  privileges, each checked against a definition generated from
  `PUBLIC_FIELD_PATHS`.** Rejected: it keeps an object that reads as the owner
  in the reader's path, and comparing a whole view definition is more surface
  than comparing one generation expression.
- **Copy each allowed field into its own plain column at ingest, as #1281 did
  for `judge_model`.** Rejected: it changes ingest and needs a backfill for
  every field, where a generated column needs neither.
- **Row-level security.** Rejected: it filters rows, and what has to be
  withheld here is columns.

## References

- [#1366](https://github.com/luciocabrera/lcabrera-stack/issues/1366),
  [#1359](https://github.com/luciocabrera/lcabrera-stack/pull/1359),
  [#1281](https://github.com/luciocabrera/lcabrera-stack/issues/1281)
- [ADR-133](ADR-133-serve-the-eval-dashboard-from-the-showcase-as-aggregates-only.md),
  [ADR-134](ADR-134-the-eval-writer-role-is-granted-on-the-evals-schema-not-its-owner.md),
  [ADR-130](ADR-130-keep-eval-history-in-a-private-workspace-with-its-own-schema-and-migrator.md)
- [PostgreSQL: `CREATE VIEW`, `security_invoker`](https://www.postgresql.org/docs/current/sql-createview.html)
- [PostgreSQL: `GRANT` on columns](https://www.postgresql.org/docs/current/sql-grant.html)
