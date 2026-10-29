---
governs:
  - server
  - ui
---

# ADR-145 — Refuse a column outside `allowedColumns`, and a keyset cursor that does not match its sort, with a typed error that serialises without the column

**Status:** Accepted

**Issue:** #1524. **Relates to:** [ADR-050](ADR-050-server-error-translation-and-result-contract.md), [ADR-066](ADR-066-grouping-guard-rails-and-per-query-timeout.md), [ADR-052](ADR-052-keyset-pagination-for-infinite-scroll.md).

## Context

`allowedColumns` exists for column names that arrive on a request. When a call
named a column outside the list, `assertColumnAllowed` threw a plain `Error`
whose message quoted the column. The keyset cursor checks in
`assertKeysetCursor` did the same for a cursor that does not match its sort.

Both are the package refusing what the call named. Nothing reached the
database, and nothing in the package failed. But a plain `Error` is what an
unforeseen bug throws too, so a caller could tell the two apart only by
matching the message text. `toSerializableDbError` mapped it to
`{ kind: 'unexpected' }` with a fixed message, so an HTTP edge answered a
request it should have rejected with a 4xx as if the server had faulted.

The package already had one refusal of this kind: `GroupingRefusedError`, a
typed error carrying a closed `reason` and the `column`, serialised as
`{ kind: 'grouping-refused' }` (ADR-066).

## Decision

- `@lcabrera/server/errors/query-refused.error` exports `QueryRefusedError`,
  the one refusal class. It extends `Error`, not `PersistenceError`, for the
  reason ADR-066 gives for `GroupingRefusedError`: `instanceof PersistenceError`
  means the database rejected something. It carries `reason`, `cause` and, when
  the refusal is about one column, `column`. Its message still quotes the
  column, for the server log.
- Its `reason` is typed `GroupingRefusalReason | QueryRefusalReason`, because
  that is what `instanceof QueryRefusedError` can actually see. A generic class
  was tried and rejected: TypeScript narrows `instanceof` on a generic class to
  its `any` instantiation, so the narrowed `reason` was `any`, and an
  exhaustive `switch` over it was not checked at all. A type-level test pins the
  union.
- `GroupingRefusedError` now extends `QueryRefusedError`, narrows `reason` to
  `GroupingRefusalReason` and adds only `estimatedRows`. Its constructor,
  fields, `name` and serialised kind are unchanged, so code that throws or
  catches it keeps working, and `instanceof QueryRefusedError` is one check for
  every refusal.
- `QueryRefusalReason` in `errors/errors.types` is the closed set:
  `column-not-allowed`, `keyset-sort-missing`, `keyset-cursor-mismatch`,
  `keyset-sort-not-unique`, `keyset-unique-value-missing`.
- `assertColumnAllowed` and `assertKeysetCursor` throw it. Every builder that
  checks an allow-list, read or write, inherits it.
- `SerializableDbError` gains
  `{ kind: 'query-refused', reason, message }`. `toSerializableDbError` tests
  `GroupingRefusedError` first, then the base. It writes `message` from a fixed
  sentence per `reason`. It does **not** forward the error's message, and it
  does not carry `column`. A refusal whose reason has no sentence is
  `unexpected`.
- `assertGroupColumn` keeps re-throwing an allow-list refusal of a group key as
  `GroupingRefusedError` with reason `unknown-column`, so a grouped read still
  reports every refusal under one kind.
- `@lcabrera/ui`'s `TableResponseError` gains the same member, with its own
  `TableQueryRefusalReason`. One reader, `readRefusedError`, reads both refusal
  kinds through one guard factory, `createTableRefusalReasonGuard`, and replaces the
  grouping-only reader and guard it was built from. The two unions
  are declared twice on purpose
  ([ADR-039](ADR-039-duplicate-over-undeclared-edges.md)), and a contract test
  in the harness app assigns each to the other, so one cannot gain a member the
  other lacks.
- The package still chooses no status code. The README's HTTP example maps
  `query-refused` to 400.

## Consequences

- A caller can branch on `instanceof QueryRefusedError`, or on
  `kind === 'query-refused'` after serialising, and answer a 4xx.
- `instanceof QueryRefusedError` is also true for a `GroupingRefusedError`. A
  caller that handles the two differently checks the subclass first, as
  `toSerializableDbError` does.
- `SerializableDbError` has one more member. A consumer that switches over
  `kind` exhaustively stops compiling until it handles `query-refused`. That is
  the intended break, and the changeset says so.
- The serialised form does not say which column was refused, so a client cannot
  highlight it from the body alone. The client sent the column, so it can work
  it out; the server log has the full message.
- `grouping-refused` serialises like `query-refused`: a fixed sentence per
  reason, from a table keyed by every `GroupingRefusalReason`, so a new reason
  does not compile until it has a sentence and a decision about its column
  (#1532). The table also says whether the reason keeps `column`. A group key
  is picked from the capabilities the server published, so naming it back
  tells the client which of its own choices to undo, and the reasons raised
  only after the allow-list accepted the column keep it. A column outside
  `allowedColumns` was never published, so echoing it back only reflects
  request text into a response body. `unknown-column` and `duplicate-keys` can
  be raised before the allow-list, so they never carry `column`.
  `unknown-column` also covers a listed column the catalogue has no capability
  for. Giving that case its own reason would change the published reason union
  and the copy `@lcabrera/ui` keeps of it, so its sentence names every cause
  instead.
- `assertSafeIdentifier` still throws a plain `Error`. It checks names this
  package was configured with (schema, table) as well as request-supplied
  columns, so typing it as a request refusal would mislabel a configuration
  fault. A request column that fails the syntax check still serialises as
  `unexpected`.

## Alternatives considered

- **Throw `GroupingRefusedError` for a non-grouped read too.** Its name and its
  `kind` say the read was grouped, and its reason vocabulary is about grouping.
  A filter on a flat read refused under that kind would misreport what happened.
- **Rename `GroupingRefusedError` to a general refusal.** It is a published
  export and its `kind` is a published wire value. Renaming breaks every
  consumer for a name; making it a subclass of the general class gives the same
  sharing with no break.
- **One class whose `reason` union covers both vocabularies, with the kind
  chosen by reason.** `grouping-refused` is a published kind with its own
  closed reason set, and clients branch on it: a grid titles a refused grouping
  differently from a failed load. Keeping it needs something that says "this
  refusal is about a grouping", and `instanceof GroupingRefusedError` is the
  check consumers already write. Choosing the kind from the reason would also
  make a column refusal `instanceof GroupingRefusedError` if the two names
  pointed at one class.
- **A sibling class beside `GroupingRefusedError`.** It was the first draft of
  this change. It duplicated the constructor and fields, and it left no single
  check for "the package refused this", so a consumer would have had to list
  both.
- **A `PersistenceError` subclass.** Nothing came from the database, and that
  class means the database rejected something.
- **Forward the error's message.** It quotes the column the request named. The
  serialised forms in ADR-050 carry only text this package wrote for that kind,
  and a fixed sentence per reason keeps that true.

## References

- Issue #1524.
- ADR-050 for the serialisable error contract; ADR-066 for `GroupingRefusedError`.
