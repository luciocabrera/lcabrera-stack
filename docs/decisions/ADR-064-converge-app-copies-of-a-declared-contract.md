# ADR-064 — Duplicate a contract across a boundary you may not declare; alias it across one you already have

- **Status:** Accepted
- **Date:** 2026-08-12
- **Scope:** `apps/shared` (`api-shared`), `apps/api-server`, `apps/api-server-fast` — the enterprise-order column-filter contract
- **Issue:** #567
- **Extends:** [ADR-039](./ADR-039-duplicate-over-undeclared-edges.md) — its decision stands unchanged; this names the case it does not cover
- **Related:** [ADR-038](./ADR-038-public-package-topology-by-runtime.md) (runtime split), [ADR-049](./ADR-049-findings-reports-are-produced-on-demand.md)

## Context

ADR-039 decided that `@lcabrera/ui` and `@lcabrera/server` each declare the
column-filter shapes independently rather than share them, because neither
package may depend on the other: the import that used to make sharing work
resolved only through a consumer's tsconfig `paths` alias, and declaring the
dependency for real would have put the Postgres driver back into a
browser-safe package's graph.

That reasoning is entirely about an **undeclared edge**. It says nothing about
what the apps should do, and the apps read it as a licence to restate the shape
too. By the time #567 was filed the same contract was written down five times:
twice in the packages, once as TypeScript types in `apps/shared`, once as a Zod
schema in `apps/api-server`, and once as a JSON Schema in `apps/api-server-fast`.
Only the first two had a conformance test.

The three app copies had already drifted, in the direction that costs a user a
request. Both packages declare a number filter's `value` as possibly undefined
and document why — the filter is a thing the user is still editing, and
`toQueryFilters` emits no SQL clause for a value that is not there yet. All
three app copies required it. The same divergence existed for every empty-string
value the mappers deliberately tolerate. So a table filtering mid-keystroke got
a page of rows from the React Router route and a 400 from either API server, for
the identical `filter` payload.

## Decision

**Duplication is bought by an edge you may not declare. Where the edge is
already declared, alias.**

`api-shared` declares `@lcabrera/server` as a dependency and hands the filters it
parses straight to that package's `toQueryFilters`. Nothing about ADR-039's
reasoning reaches it, so it no longer restates the shape:
`enterpriseOrders.types.ts` aliases `ColumnFilter` and re-exports the variants.
The copy that could drift is gone rather than guarded.

**A copy that cannot be a type is guarded behaviourally, from a single
statement of the contract.** The two request validators are not types and cannot
be aliased. `ENTERPRISE_ORDER_FILTER_CONTRACT_CASES` in `api-shared` is one
statement of every filter state the endpoints must accept, and each API server
asserts against it that the state is accepted **and** reaches the query layer
with exactly the clauses the React Router route builds from the same JSON. A
validator that is stricter than the contract shows up as a rejection; one that is
looser shows up as a different clause set.

**The contract's closed vocabularies are what the guard is anchored to.** The
case set is keyed by each variant's own operator union, so adding an operator to
`@lcabrera/server`'s contract — or removing one — stops `api-shared` compiling
until a case exists for it, and the new case then fails both API-server suites
until their schemas accept it. The guard cannot go quiet by being out of date.

**The validators validate the vocabulary, not the value.** `type` and `operator`
are closed sets and are checked strictly. Values are not: what becomes SQL is
`toQueryFilters`'s decision, made once, in the package both servers already use.

## Consequences

- The register of copies now has a mechanism behind it. What used to be five
  hand-maintained copies is one aliased type and two validators that fail a test
  the moment they disagree with the contract.
- `api-shared` ships a test-support export. It is a private workspace package, so
  this reaches no registry, but it is a production barrel carrying a fixture and
  that is a real cost — the alternative was the same fixture written twice, in
  two suites that would then drift from each other unnoticed.
- The API servers now accept filter payloads they used to reject, including ones
  that produce no `WHERE` clause at all. That is the point: the React Router
  route has always served them. It does mean a caller can send a filter that
  filters nothing and get a full page, which is what the table already relies on
  while a filter is being typed.
- ADR-039's promotion trigger is untouched. It fires on a third _consumer_, not
  a third _copy_, and it has still not fired; this decision removes copies
  without creating a shared package.
- The rule is narrow on purpose. It licenses aliasing only where the dependency
  is already declared for other reasons. It is not a licence to add a dependency
  in order to alias — that is the edge ADR-039 refused.

## Alternatives considered

- **Document the difference as intentional instead of closing it.** The issue
  allows this, and it fails on the evidence: no reading makes a 400 for a filter
  the sibling route serves intentional. The laxness in `@lcabrera/server` is
  already documented as deliberate, which is exactly why the app copies had to
  follow rather than diverge.
- **Fix only the number filter.** It is the case the issue names, and it is one
  instance of a class — every empty-string value the mappers tolerate had the
  same divergence. Fixing the named symptom would have left the same bug reachable
  through a cleared text box.
- **Extract a `@repo/contracts` package.** Out of scope by ADR-039's own trigger,
  and it would buy nothing here: the contract already has a home in a package
  both API servers depend on.
- **Tighten the packages instead, so a drafting filter never reaches the wire.**
  That inverts the ownership. The drafting state is a property of the filter UI,
  the packages are the product, and their laxness is a documented decision
  (ADR-039) rather than an oversight to correct.
- **Keep the app types duplicated and add a conformance test for them.** A test
  that asserts two type aliases are the same type is strictly worse than one
  alias: same guarantee, one more file to keep in step.

## References

- Issue #567 — the drift, and the shape probe that found all three app copies
  (searching by type name finds nothing, because the copies are named for the
  domain rather than the shape)
- [ADR-039](./ADR-039-duplicate-over-undeclared-edges.md) — duplication over an
  undeclared edge, and where the cross-package guarantee lives
- `apps/shared/src/features/enterpriseOrders/enterpriseOrders.fixtures.ts` — the
  contract cases
- `apps/react-router/src/routes/enterprise-orders/filterContract.test.ts` — the
  package-to-package half of the guard
