---
'@lcabrera/server': minor
'@lcabrera/api': minor
---

The OLAP seam is now part of the packages, so a consumer no longer has to write
it.

Grouping, rollup, cube and drill are features of a table in the same sense that
sorting and filtering are, but the code joining the query engine to the grid had
to be written by the consuming app: how to decode a grouped read, and how to turn
a group row back into a query for the rows underneath it. Both are now shipped
(ADR-081).

**`@lcabrera/server` gains `db/olap/`.**

- `toGroupRow` turns one row of a grouped read into the group summary a grid
  renders, decoding the `GROUPING()` mask — the only thing that separates a
  subtotal from a genuine NULL, since the two are textually identical. It sits
  beside `build-group-query`, which is what writes that mask.
- `toDrillRead` turns a group row into the paginated read of the rows underneath
  it, carrying four rules that are easy to get wrong and quiet when they are: the
  grouped view's filters are inherited unchanged, a NULL key becomes `IS NULL`
  rather than an equality that is never true, group-key terms come out of the
  sort while the primary key goes in as a tiebreaker, and the read carries no
  grouping — which would otherwise return group rows again. It answers a typed
  refusal for a grand total, a subtotal or an incomplete path rather than an
  empty page.
- `toGroupLabel` formats a group key against the closed dimension vocabulary.

Your route supplies its own primary key and page ceiling, and nothing else.

**`@lcabrera/api` gains `olap/`** — the wire codec for a drill request.
`encodeDrillGroup` and `parseDrillGroup` are two halves of one thing and now live
together, so a browser encoder and a server parser cannot drift apart. It also
carries `OLAP_GROUP_ROW_FIELD`, the row field a grouped read attaches its summary
to, which `@lcabrera/ui` re-declares as `TABLE_GROUP_ROW_FIELD`.

**`@lcabrera/server` now depends on `@lcabrera/api`.** The dependency runs
Node → browser-safe, which is the harmless direction: `@lcabrera/api` declares no
dependencies of its own, so nothing new enters your graph.

No existing API changed.
