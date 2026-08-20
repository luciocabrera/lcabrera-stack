import type { TableColumnAggregate } from '../Table.types';

import { MAX_TABLE_COUNT_DISTINCT_AGGREGATES } from '../Table.constants';
import { countCountDistinct } from './countCountDistinct.util';

/**
 * Whether an aggregate list is one a grouped read can carry — the whole-request
 * half of grouping legality, and the only guard rail in `@lcabrera/server`'s
 * `group-query-builder.constants.ts` that a client surface can breach purely by
 * what it offers.
 *
 * `Table/ARCHITECTURE.md` enumerates the rails and says which of them this side
 * can predict at all; this is the one that needed a home. It is a property of
 * the **request** — how many `countDistinct` aggregates every column carries
 * between them — so no per-column answer can decide it, and putting it in
 * `resolveOfferableAggregates` would mean lying about what that predicate
 * answers (#842). The same seam `TableGroupingRefusalReason` sits on rather than
 * `TableGroupKeyRefusalReason`.
 *
 * This is the question a **boundary** asks: is a list that already exists legal?
 * `sanitizeGroupingByColumns` asks it of a URL and `areGroupAggregatesLegal` of
 * a store seed, and both refuse the configuration whole rather than dropping the
 * second entry — ADR-061's rule, and here the alternative is worse than usual,
 * since which of two `countDistinct` aggregates to keep is a question the link
 * did not answer.
 *
 * An **offering** surface wants `hasCountDistinctBudgetLeft` instead, and the
 * two are deliberately separate files rather than one predicate with a flag:
 * they disagree on exactly the input that matters, a list holding the budget
 * already.
 */
export const isWithinCountDistinctBudget = (
  aggregates: readonly TableColumnAggregate[],
) => countCountDistinct(aggregates) <= MAX_TABLE_COUNT_DISTINCT_AGGREGATES;
