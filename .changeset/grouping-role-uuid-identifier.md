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
