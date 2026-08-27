---
id: browse-and-edit-a-table-without-writing-sql
lines:
  - application
persona: data-user
state: unmet
packages:
  - ui
  - api
  - server
requires:
  - connect-a-grid-to-a-table-by-name
  - express-a-read-through-one-entry-point
issues:
  - 1000
evidence:
  - type: code
    ref: apps/showcase/src/routes/enterprise-orders
  - type: doc
    ref: packages/server/src/db/olap
---

# A table is browsable and editable without SQL

## Statement

I am not a developer. I want to open a table, read through it, narrow it to the
rows I care about, summarise it by a column, open a group to see the rows behind
a number, and correct a value — the way I would in a database tool somebody set
up for me. I should not have to write SQL, and I should not have to ask anyone
technical to change what I am looking at.

## Acceptance

- Browsing, filtering, grouping, drilling into a group and editing a row are all
  reachable without SQL being typed anywhere.
- The composition lives in a package: an application does not assemble it from
  three packages plus its own route code.
- The showcase consumes that composition rather than reimplementing it, so the
  demonstration and the product are the same thing.

## Notes

This is the requirement that is true of the composition and of no single
package, which is exactly how it goes missing: every package can pass its own
tests while the thing this persona needs is reachable only by assembling an
application by hand. It leans on the two requirements in `requires`; it is not a
restatement of them.
