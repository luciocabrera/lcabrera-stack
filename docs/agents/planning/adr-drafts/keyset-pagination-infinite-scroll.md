# Draft — Keyset pagination for infinite scroll

> **Draft — it holds no ADR number.** A number is assigned when the decision is
> adopted, not when it is proposed: a draft that reserves one goes stale as the
> sequence moves on, which is how two ADR-047s came to exist. On adoption, move
> this file into the home its tier calls for and take the number
> `vp run adr:verify` reports as free. See
> [ADR-048](../../../decisions/ADR-048-adr-taxonomy-and-one-sequence.md).

## Context

Infinite-scroll load-more paginates with `OFFSET k` in `selectOrdersPage`
(`.server/enterpriseOrders.service.ts`), which is O(offset): the database walks and
discards `k` rows on every page. ADR-008 already established a
`(sort…, order_id)` **total order** as the primary-key sort tiebreaker — i.e. a
stable cursor already exists.

## Problem

`OFFSET`-based load-more degrades linearly as the user scrolls; deep pages get
progressively slower for no functional reason, since the total order needed for a
keyset cursor is already guaranteed.

## Options considered

1. **Keep `OFFSET` everywhere.** Simple, but O(offset) on every load-more.
2. **Keyset everywhere, drop offset.** Breaks jump-to-page grids, which genuinely
   need random access.
3. **Keyset for infinite scroll, keep offset for jump-to-page.** Chosen.

## Decision

- Add opt-in keyset support to `@lcabrera/server` query builder
  (`build-select-query.util.ts`, `build-where-clause.util.ts`,
  `query-builder.types.ts`): a `cursor` producing `WHERE (cols, pk) > (:cursor)`,
  O(limit).
- The cursor is the ADR-008 `(sort…, order_id)` tuple.
- Wire keyset into the paginated infinite-scroll route only; **keep `OFFSET` for
  jump-to-page grids.**

## Consequences

- New public capability on `@lcabrera/server`: api-surface event → dual exports,
  snapshot regen, changeset. Additive.
- Correctness depends on the sort always including the PK tiebreaker (ADR-008); the
  builder must reject a keyset request without a total order.
- Larger change than the other perf items; lands behind the existing total-order
  guarantee.

## References

- Plan: `architecture-improvement-plan.md` §P3
- ADR-008 (primary-key sort tiebreaker / columns-derived id) — cite by name, dual
  ADR-008 exists (see CLAUDE.md)
- Planner issues: P-10 (this ADR), P-11
