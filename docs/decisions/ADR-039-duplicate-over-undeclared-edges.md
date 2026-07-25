# ADR-039: The packages are the product — duplicate a contract rather than share it through an undeclared edge

**Status:** Accepted — extends [ADR-038](ADR-038-public-package-topology-by-runtime.md)

## Context

The `packages/` are what this repo ships. The `apps/` exist to exercise them:
`apps/react-router` puts the Table, the store pattern and the query layer under
realistic load, and `apps/admin_system`, `apps/api-server` and the rest play the
same role for their areas. That ordering had never been written down, and
`AGENTS.md` in fact read the other way round — _"The primary app is
`apps/react-router/`"_ — which points a reader at the harness and away from the
product.

The ordering is not decorative. It decides a class of question that otherwise
gets answered by taste, and the column-filter shapes were a live instance
(issue #160).

`packages/ui` declared the Table's filter shapes by importing them from
`@repo/server/filters/filters.types` and re-exporting them. `@repo/ui` does not
list `@repo/server` as a dependency; the import resolved purely through a
tsconfig `paths` alias. Inside this repo that works. It works for a reason that
does not travel: every consumer's generated tsconfig happens to carry the alias.
Those tsconfigs are generated, and an alias has already been dropped by a routine
regeneration once before (see ADR-038's history).

Three options were on the table:

1. **A third shared package** holding the contract.
2. **Duplicate** the shapes into each package.
3. **Accept** the `paths` coupling and document it.

Option 3 has an expiry date. The imports are type-only, so they erase and cost
nothing at runtime — but the moment `@repo/ui` is published, its emitted
declarations name a specifier no external consumer can resolve, pointing into a
Node-only package whose dependency graph includes the Postgres driver. Declaring
the dependency to fix that would re-introduce the `@repo/ui` → `pg` edge that
ADR-038 removed and `check:public-api` exists to prevent.

Option 1 is correct and, measured against this contract, disproportionate. The
contract is five type aliases and a union: 58 lines, no runtime, and roughly two
shape changes across its nine commits. A new workspace costs a `ts-configs`
generator entry, an eslint config, a `typecheck` script, a suppressions-gitignore
decision, a COMMANDS.md entry, a label-taxonomy entry, a coverage decision and CI
fan-out — and the "17 workspaces" count that several gates assert. That is a
large fixed cost around a file that does not move, and shared-contract packages
tend to accumulate everything that is awkward to place.

## Decision

**A package must stand on its own: declared dependencies, a resolvable public
surface, and no reliance on a consumer's tsconfig `paths` to make an import
work.** When package self-containment and app convenience (or in-repo elegance)
conflict, the package wins.

Applied to #160: `@repo/ui` and `@repo/server` each declare the column-filter
shapes independently. Neither package knows the other exists.

Duplication is acceptable here because it is **cheap, stable and structurally
checked**:

- TypeScript is structural, so a filter built in the UI remains assignable to the
  query layer with no adapter or conversion.
- The contract is small and near-frozen, so the maintenance cost of two copies is
  close to zero.
- Drift fails the build (see below), so the copies cannot silently diverge.

There is also a design gain, which is the stronger argument. The shared type was
carrying UI _drafting_ states into a SQL-facing definition — a number filter
whose `value` is `undefined` while the user is mid-keystroke, a select filter
whose `operator` may be omitted. One type could not honestly describe both "what
the user is editing" and "what can be turned into SQL". Split, each side says
what it means, and the query layer's laxness is documented as deliberate
compatibility rather than reading like an oversight.

## Where the guarantee lives

**Cross-package conformance is verified in the app, because the app is the only
thing that legitimately depends on both** — integrating the packages is precisely
what the harness is for. `apps/react-router` hosts a `filterContract` test that
exercises every filter variant through `toQueryFilters`; production code
(`parseOrdersPageParams`) already enforces the same assignability.

**The converse does not hold: never put a guarantee a _package_ depends on into
an app.** Apps are disposable; packages are not.

One implementation detail is load-bearing and was got wrong first. The test's
fixture is annotated `: Record<string, ColumnFilter>` rather than using
`satisfies`. `satisfies` preserves each value's narrow literal type, so the call
only checks the handful of filters actually written down — adding an operator to
one package's union sails straight through. The annotation widens the values to
the union, so the call checks the whole contract. Verified by deliberately adding
an operator to one side: with `satisfies`, `typecheck` passed; with the
annotation, `typecheck:all` exits 2 naming the incompatibility.

## Consequences

- Two definitions of the filter shapes exist and must be changed together. The
  conformance test and the app's production path make that a build failure rather
  than a latent bug.
- `@repo/ui` no longer resolves anything through `@repo/server`, so its
  publishable surface is self-contained.
- Fallow's duplication detector does not flag the two type blocks, so no
  baseline entry or suppression is involved.
- This is a one-way door only in the cheap direction: if a third consumer appears
  (a filtered table in `admin_system`) or the contract grows runtime code
  (validation, shared mappers), promoting it to a shared package is
  straightforward, and at three copies the ceremony starts paying for itself.

## Alternatives rejected

- **A `@repo/contracts` package now.** Correct in the abstract; not earned by 58
  lines of frozen types with one consumer on each side.
- **Keeping the `paths` coupling.** Free today, broken at publication, and
  dependent on generated config that has silently lost an alias before.
- **Making `@repo/server` depend on `@repo/ui`** (inverting the edge). Worse: it
  points a Node-only package at a browser one and inverts the actual direction of
  authorship — the shapes are the UI's.
