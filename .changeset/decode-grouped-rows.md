---
'@lcabrera/server': minor
---

A grouped read can be issued and decoded without the caller re-deriving how.

`@lcabrera/server/db/olap` shipped `toGroupRow`, which decodes one row. What it
did not ship was the step either side of it: building the aggregate list a
grouped read is issued with, pairing each requested aggregate with the alias the
builder projected it under, and deriving the grouped `ORDER BY`. Every consumer
had to write those again, against a result that already carries everything they
need.

**`toGroupAggregates` and `decodeGroupedRows` are two halves of one convention.**
A grouped read always asks for `count(*)`, because a group row states how many
rows it covers whether or not the route selected an aggregate — and the position
`count` occupies is the position the decode skips. Nothing in the type system
relates the two, so they ship in one module for the reason ADR-082 keeps an
encoder beside its parser: split apart they can disagree in any way at all and
still compile, and the symptom is every aggregate rendering against its
neighbour's column, with no error anywhere.

**`toGroupSort`** derives the grouped `ORDER BY` from the table's own sort — one
term per key in nesting order, carrying the user's direction where they sorted
that key and ascending where they did not. The nesting order is the tree, so a
sort sets a level's direction rather than reordering the levels. A sort on any
other column is dropped, because a grouped result has one row per group and no
row of that column's values.

A route now supplies its table, the aggregates its UI offered, and its row
ceiling. Nothing else.
