---
id: build-an-api-from-the-server-packages
lines:
  - application
persona: application-developer
state: met
packages:
  - server
  - utils
requires: []
issues: []
evidence:
  - type: doc
    ref: packages/server/README.md
  - type: test
    ref: packages/server/src/table-page/create-table-page-loader.http.test.ts
  - type: command
    ref: vp run test:ci
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

The example is the "Serve an HTTP API" section of `packages/server/README.md`:
an endpoint from a Web `Request` to a `Response`, and a `node:http` server for
it. Its own test copies that section's two code blocks out of the README, imports
them with only `pg` replaced, and makes real HTTP requests. A change that breaks
the example as written, or lets driver text into a response, fails `test:ci`.
That was checked by making the README's `handle` return the driver error, by
deleting its pool listener, and by renaming one block; each failed the test.

`@lcabrera/api` installs with `@lcabrera/server`, which depends on it for the
filter wire shape, but the example imports nothing from it.

The two things the example works around are filed rather than built into it: a
column outside `allowedColumns` is refused with an untyped error, so it reads as
a server fault
([#1524](https://github.com/luciocabrera/lcabrera-stack/issues/1524)), and the
pool `getPool` returns has no `error` listener, so an idle-connection failure
stops the process unless the consumer attaches one
([#1523](https://github.com/luciocabrera/lcabrera-stack/issues/1523)).
