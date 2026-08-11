---
'@lcabrera/server': minor
---

`@lcabrera/server` gains `getColumnGroupingCapabilities`
(`@lcabrera/server/db/get-column-grouping-capabilities.util`) — the answer to
"may this column be grouped, and what may it be aggregated with?", resolved from
the Postgres catalogue in one round trip rather than from a hand-maintained type
map.

It applies two gates, and a column must clear both. The **analytical role**,
derived from `pg_type.typcategory`, decides what is worth offering: dimensions
(string, boolean, date, enum) are group keys, facts (the numeric family) are
aggregated and may be keys when their statistics show low cardinality, and
everything else — `jsonb`, geometric types, arrays, `bytea` — is out of both. The
**catalogue** then decides what Postgres can actually do, so an extension or
domain type the role table has no opinion about still cannot reach an operator it
lacks, and a `boolean` column is not offered the `min`/`max` Postgres does not
define for it.

The role gate exists because the catalogue alone gets `jsonb` wrong: it has an
equality operator, so `GROUP BY` on it parses and runs, and a catalogue-only rule
would offer a column whose grouping is analytically meaningless.

A refused column carries one of five distinguishable reasons rather than a bare
`false`, so a UI can say why — `not-a-dimension`, `no-equality-operator`,
`unique-ish`, `stats-unavailable`, `too-many-distinct`. Grouping by a primary key
is the likeliest mistake, and it reports as `unique-ish`.

Schema, table and the column list are all bound parameters, so the query has no
identifier-interpolation surface. `@lcabrera/server/db/group-query-builder/group-query-builder.types`
is exported alongside it for `ColumnGroupingCapability`, `AggregateFn` and the
refusal-reason union.

Additive only — no existing export changes.
