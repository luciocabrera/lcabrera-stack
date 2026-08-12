---
'@lcabrera/server': minor
---

Admit `uuid` columns as grouping dimensions.

`getColumnGroupingCapabilities` previously refused every `uuid` column with
`not-a-dimension`, because Postgres files `uuid` under the same type category as
`jsonb` and the analytical-role gate resolves from that category. A foreign-key
`uuid` — `tenant_id`, `region_id` — is now a legal group key, offered `count`
and `countDistinct`.

`uuid` is admitted by name rather than by category, so `jsonb`, `xml` and
`bytea` remain refused. It also has to demonstrate low cardinality: unlike an
ordinary dimension, a `uuid` column with no statistics is refused
`stats-unavailable` rather than grouped optimistically, and a primary-key `uuid`
is still refused `unique-ish`.

**Breaking for one published type.** `ColumnCapabilityRow` (from the
`./db/group-query-builder/group-query-builder.types` subpath) gains a required
`typeNamespace` field, so code that _constructs_ one — a test double, or a
hand-written query typed to that shape — no longer compiles until it supplies
the field. Reading a row is unaffected, and no exported function takes one as a
parameter.

The field is required rather than optional on purpose: the name alone does not
identify a type. Type names are per-schema, so a `CREATE TYPE app.uuid AS (…)`
composite reports `typname = 'uuid'` exactly like the built-in, and matching
without the namespace would admit an unrenderable type as a group key. An
optional field would let a caller silently skip the only value that tells the
two apart.
