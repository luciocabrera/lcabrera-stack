---
id: use-the-grid-without-a-router
lines:
  - application
persona: application-developer
state: unmet
packages:
  - ui
requires:
  - render-a-table-from-rows-alone
issues:
  - 995
evidence:
  - type: code
    ref: packages/ui/package.json
  - type: code
    ref: packages/ui/src/components/Table
---

# The grid works with no router mounted

## Statement

My application does not use React Router, or the grid sits on a page outside the
router's tree. I still want to sort a column, filter, resize and page through the
data. I accept that nothing is written back to a URL when there is no URL to
write to — what I do not accept is an interaction that throws.

## Acceptance

- Every interaction that does not inherently need a server works with no router
  present in the tree.
- State that would be persisted through the router degrades to in-memory rather
  than throwing.
- The peer declarations in `packages/ui/package.json` say what the code actually
  requires: a dependency the grid calls unconditionally is not labelled
  optional, and one it can do without is.
- A test renders the grid outside a router provider and drives a state change
  through it.

## Notes

Persistence is server-owned by design, so the shape of the fix is to make it
**absent** when there is no router, not to make it fail — the seam already
exists, it is just not optional at it.
