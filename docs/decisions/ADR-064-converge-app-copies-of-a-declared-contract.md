# ADR-064 — Duplicate a contract across a boundary you may not declare; alias it across one you already have

- **Status:** Accepted
- **Date:** 2026-08-12
- **Scope:** the API servers' shared workspace and the two API servers — the enterprise-order column-filter contract
- **Amended:** 2026-08-17 — all three workspaces left for a repository of their own (#686)
- **Issue:** #567
- **Extends:** [ADR-039](./ADR-039-duplicate-over-undeclared-edges.md) — its decision stands unchanged; this names the case it does not cover
- **Related:** [ADR-038](./ADR-038-public-package-topology-by-runtime.md) (runtime split), [ADR-049](./ADR-049-findings-reports-are-produced-on-demand.md)

> **⚠️ Amended 2026-08-17.** The body below is left exactly as written — a dated
> record of what was true when the decision was made. The three workspaces in
> its Scope moved to a repository of their own in #686, so every artifact named
> below is now over there.
>
> **The status stays Accepted, because the decision was the rule, not the
> example.** "Duplication is bought by an edge you may not declare; where the
> edge is already declared, alias" still governs this repository, and it still
> extends [ADR-039](./ADR-039-duplicate-over-undeclared-edges.md), which is
> live. Read the app copies below as the worked case that produced the rule.
>
> One thing did change in substance: the shared workspace declared `@lcabrera/server` as
> a workspace dependency, and the aliasing this ADR chose rested on that edge
> being declared. It now resolves that package **from the registry** instead.
> The rule is unaffected — a declared edge is a declared edge — but a reader
> checking the reasoning against this repository will not find the workspace.

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
twice in the packages, once as TypeScript types in the shared workspace, once as
a Zod schema in one API server, and once as a JSON Schema in the other.
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

The shared workspace declares `@lcabrera/server` as a dependency and hands the filters it
parses straight to that package's `toQueryFilters`. Nothing about ADR-039's
reasoning reaches it, so it no longer restates the shape:
`enterpriseOrders.types.ts` aliases `ColumnFilter` and re-exports the variants.
The copy that could drift is gone rather than guarded.

**A copy that cannot be a type is guarded behaviourally, from a single
statement of the contract.** The two request validators are not types and cannot
be aliased. `ENTERPRISE_ORDER_FILTER_CONTRACT_CASES` is one statement of every
filter state the endpoints must accept, and each API server asserts against it
that the state is accepted **and** reaches the query layer with exactly the
clauses the React Router route builds from the same JSON. A validator that is
stricter than the contract shows up as a rejection; one that is looser shows up
as a different clause set. It is reached through a dedicated
a `filter-contract` subpath rather than the package barrel, so it stays
out of both servers' startup path.

**Where the contract has a closed vocabulary, the guard is anchored to it —
and where it has none, the guard is not.** This split is the honest statement of
how much the case set is worth, and it is worth stating because the first draft
of this ADR claimed the stronger half for the whole.

Anchored: each filter variant's cases are keyed by that variant's own operator
union, so adding an operator to `@lcabrera/server`'s contract — or removing one
— stops the shared workspace compiling until a case exists for it, and the new case then
fails both API-server suites until their schemas accept it. An operator cannot go
unchecked.

Not anchored: the `drafting` group. "A value the mappers drop" spans an absent
key, an empty string and an empty array — three unrelated shapes with no closed
vocabulary in the type system to key on, and inventing one would only move the
hand-maintenance somewhere less visible. Its keys are therefore free-form, and a
case deleted from it is silently no longer checked. **So the states this issue
was filed for are also written into each API server's own suite as a named
regression**, independent of the shared set: deleting the coverage there means
deleting a test that says what it protects, not a key in a large object literal.

**The validators validate the vocabulary, not the value.** `type` and `operator`
are closed sets and are checked strictly. Values are not: what becomes SQL is
`toQueryFilters`'s decision, made once, in the package both servers already use.

**The validators validate the vocabulary, not the value.** `type` and `operator`
are closed sets and are checked strictly. Values are not: what becomes SQL is
`toQueryFilters`'s decision, made once, in the package both servers already use.

## Consequences

- The register of copies now has a mechanism behind it. What used to be five
  hand-maintained copies is one aliased type and two validators that fail a test
  the moment they disagree with the contract.
- The shared workspace gains a second export subpath. Three options were open, and the
  cheapest was not the first one considered: exporting the cases from the package
  barrel (one line, but both servers import that barrel from `server.ts`, build
  with plain `tsc` and run `node dist/server.js` with no bundler and no
  tree-shaking, so the object would be constructed at every server start);
  writing the cases out separately in each suite (no production cost, two sets
  that drift); or a `./filter-contract` subpath — one manifest entry, one
  specifier, one shared statement, and nothing added to either server's startup
  path. The subpath wins on every axis, and the barrel's cost is small enough
  that it would have gone unnoticed had it not been checked.
- The `drafting` group is coverage breadth, not a gate. It cannot be
  compile-time anchored (see Decision), so both API servers carry the same
  states as named regressions of their own. That is deliberate duplication
  between two servers that are already deliberate duplicates of each other, and
  it is the price of the coverage not resting on one unanchored object.
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
- **Key the `drafting` group on a synthesised vocabulary** — the contract fields
  whose type admits `undefined`, say. Rejected: it covers an absent key but not
  an empty string or an empty array, so it would have anchored part of the group
  while reading as though it anchored all of it, and it would have demanded
  degenerate cases for fields that have no drafting state. A guard that looks
  stronger than it is was the defect this issue exists to fix.

## References

- Issue #567 — the drift, and the shape probe that found all three app copies
  (searching by type name finds nothing, because the copies are named for the
  domain rather than the shape)
- [ADR-039](./ADR-039-duplicate-over-undeclared-edges.md) — duplication over an
  undeclared edge, and where the cross-package guarantee lives
- The shared workspace's `enterpriseOrders.fixtures.ts` — the
  contract cases
- `apps/react-router/src/routes/enterprise-orders/filterContract.test.ts` — the
  package-to-package half of the guard
