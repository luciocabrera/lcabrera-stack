---
id: build-an-api-from-the-server-packages
lines:
  - application
persona: application-developer
state: unmet
packages:
  - server
  - utils
requires: []
issues:
  - 1001
evidence:
  - type: doc
    ref: packages/server/README.md
  - type: doc
    ref: packages/utils/README.md
  - type: code
    ref: packages/server/src/errors/to-serializable-db-error.util.ts
---

# An HTTP API is buildable from the server packages alone

## Statement

I am putting an API over a Postgres database and I am not rendering anything. I
want to go from a connection pool to a served endpoint using only the server and
utility packages, and to know what an error is supposed to look like coming back
out — without installing a component library to find out whether that path is
supported at all.

## Acceptance

- A worked example goes end to end, from a pool to a served endpoint, using only
  `@lcabrera/server` and `@lcabrera/utils`.
- It covers the error contract, since a raw driver error must never reach a
  response — an endpoint that leaks a constraint name has leaked the schema.
- The documentation states that this path needs no interface package, rather
  than leaving a reader to infer it from the absence of a mention.
- Anything the example turns out to need and cannot import is filed or added,
  rather than written around in the example.

## Notes

`packages/server/README.md` documents the pieces well and shows fragments —
reading a page of rows, taking column names from a request, mapping a driver
error — but every fragment stops at the data layer, so the step a reader
actually has to take, from those calls to something serving a response, is the
one nothing shows. The gap is the composition and the statement that it is
supported, not the exports.
