---
'@lcabrera/server': minor
---

`@lcabrera/server/db/query-builder/build-read-query.util` exports `buildReadQuery`, the one entry point for building a read. Its single descriptor takes fields, filters, sort, `limit`/`offset` or a keyset `cursor`, and `distinct`. Add `count: true` to build the matching count, or `aggregates`, `grouping`, `keys` and the other grouped-read fields to build a `GROUPING SETS` read. The return type follows the descriptor: a grouped read returns `BuiltGroupQuery`, with the keys and masks its rows are decoded by, and every other read returns `BuiltQuery`. Identifier validation, `allowedColumns` and the grouping refusals run as they did before.

`buildSelectQuery`, `buildDistinctQuery`, `buildCountQuery` and `buildGroupQuery` are deprecated. They are still exported from their old subpaths and return the same SQL, but each now delegates to `buildReadQuery`. Their declared signatures now take the descriptor as one parameter rather than destructuring it, and the types they accept and return are unchanged. To migrate, call `buildReadQuery` with the same descriptor: add `distinct: true` where you used `buildDistinctQuery`, and `count: true` where you used `buildCountQuery`.
