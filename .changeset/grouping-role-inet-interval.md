---
'@lcabrera/server': minor
---

Admit `inet`/`cidr` and `interval` columns to the grouping role table.

`getColumnGroupingCapabilities` previously refused all three with
`not-a-dimension`, because their Postgres type categories were not in the
analytical-role mapping. An `inet` or `cidr` column now resolves as a dimension
and may be a group key; an `interval` resolves as a fact and is offered `sum` and
`avg`, which Postgres defines for it and for no other non-numeric type.

`uuid` is unchanged and still refused — it shares its type category with `jsonb`
and is indistinguishable from one in the catalogue, so admitting it is a separate
decision rather than an extension of this one.
