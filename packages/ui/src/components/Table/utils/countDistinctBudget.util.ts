import type { TableColumnAggregate } from '../Table.types';

import { MAX_TABLE_COUNT_DISTINCT_AGGREGATES } from '../Table.constants';

/**
 * How many `countDistinct` aggregates a list carries. Private: every question
 * worth asking of it is one of the two predicates below, and a bare count at a
 * call site is where the comparison drifts from `<` to `<=`.
 */
const countCountDistinct = (aggregates: readonly TableColumnAggregate[]) =>
  aggregates.filter((aggregate) => aggregate.fn === 'countDistinct').length;

/**
 * Whether an aggregate list is one a grouped read can carry — the whole-request
 * half of grouping legality, and the only guard rail in
 * `@lcabrera/server`'s `group-query-builder.constants.ts` that a client surface
 * can breach purely by what it offers.
 *
 * `Table/ARCHITECTURE.md` enumerates the rails and says which of them this side
 * can predict at all; this is the one that needed a home. It is a property of
 * the **request** — how many `countDistinct` aggregates every column carries
 * between them — so no per-column answer can decide it, and putting it in
 * `resolveOfferableAggregates` would mean lying about what that predicate
 * answers (#842). The same seam that `TableGroupingRefusalReason` sits on rather
 * than `TableGroupKeyRefusalReason`.
 *
 * This is the question a **boundary** asks: is a list that already exists legal?
 * `sanitizeGroupingByColumns` asks it of a URL and `areGroupAggregatesLegal` of
 * a store seed, and both refuse the configuration whole rather than dropping the
 * second entry — ADR-061's rule, and here the alternative is worse than usual,
 * since which of two `countDistinct` aggregates to keep is a question the link
 * did not answer.
 */
export const isWithinCountDistinctBudget = (
  aggregates: readonly TableColumnAggregate[],
) => countCountDistinct(aggregates) <= MAX_TABLE_COUNT_DISTINCT_AGGREGATES;

/**
 * Whether one more `countDistinct` would still fit — the question an **offering
 * surface** asks, which is deliberately not the one above.
 *
 * A list at the budget is legal and has no room left, so the two answers differ
 * on exactly the input that matters: `[countDistinct]` is within budget and has
 * none left. Spelling them apart is what stops a surface reaching for the
 * legality predicate and offering the entry that breaks it.
 */
export const hasCountDistinctBudgetLeft = (
  aggregates: readonly TableColumnAggregate[],
) => countCountDistinct(aggregates) < MAX_TABLE_COUNT_DISTINCT_AGGREGATES;
