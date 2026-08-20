import type {
  TableAggregateFn,
  TableColumnAggregate,
  TableColumnGroupingCapability,
} from '../Table.types';

import { hasCountDistinctBudgetLeft } from './hasCountDistinctBudgetLeft.util';
import { resolveOfferableAggregates } from './resolveOfferableAggregates.util';

type ResolveAffordableAggregatesArgs = {
  /**
   * Every aggregate applied in **this surface's** commit context, across every
   * column — the live grouping for the header menu, the drawer's draft for the
   * picker.
   */
  readonly applied: readonly TableColumnAggregate[];
  /** What the catalogue said about this column (ADR-058); absent means nothing. */
  readonly capability: TableColumnGroupingCapability | undefined;
  /** The column being offered for; the empty string while none is chosen. */
  readonly columnKey: string;
  /** Whether this column is one of the group keys **this surface** is showing. */
  readonly isGroupKey: boolean;
};

/** Typed so every exit answers with one array type and callers need no widening. */
const NO_AGGREGATES: readonly TableAggregateFn[] = [];

/**
 * The offerable aggregates the **whole request** still has room for, and the
 * ones it does not.
 *
 * `resolveOfferableAggregates` answers per column, from the catalogue's type
 * legality and group-key membership. This composes a rule that column cannot
 * see: `@lcabrera/server` refuses a read carrying more than
 * `MAX_TABLE_COUNT_DISTINCT_AGGREGATES` `countDistinct` aggregates, and the
 * count is over every column together (#842). Both offering surfaces resolve
 * through here, so neither can offer a second one and have the read refused
 * afterwards (ADR-068 renders that refusal rather than throwing it, which is the
 * fallback working — not a reason to make the offer).
 *
 * **The column's own entries are left out of the count on purpose.** Asking
 * "would one more fit?" of every column but this one is what keeps the header
 * menu's applied item standing: that item is the only affordance that removes
 * the aggregate, so a rule withholding it everywhere would strand a user with a
 * `countDistinct` they cannot clear from the menu. A column carrying it counts
 * zero against itself and one against every other column, which is the same
 * answer read from either side. The drawer's picker never sees the difference —
 * `resolveAddableAggregates` subtracts what the column carries anyway.
 *
 * `withheld` is the second half, and it exists because the caller cannot
 * reconstruct it: a function missing from `affordable` was either withheld here
 * or never legal for the column, and only the first has anything to tell the
 * user. It is empty whenever the column was not offered `countDistinct` in the
 * first place, so a rail that did not bite says nothing.
 *
 * **It is not where the rule is enforced**, for `resolveOfferableAggregates`'
 * reason: the grouping configuration is URL state, so a request can always name
 * two. `sanitizeGroupingByColumns` refuses that at the client's boundary and
 * `assertGroupAggregates` refuses it at the server's.
 */
export const resolveAffordableAggregates = ({
  applied,
  capability,
  columnKey,
  isGroupKey,
}: ResolveAffordableAggregatesArgs) => {
  const offerable = resolveOfferableAggregates({ capability, isGroupKey });
  const appliedElsewhere = applied.filter(
    (aggregate) => aggregate.columnKey !== columnKey,
  );

  if (hasCountDistinctBudgetLeft(appliedElsewhere)) {
    return { affordable: offerable, withheld: NO_AGGREGATES };
  }

  return {
    affordable: offerable.filter((fn) => fn !== 'countDistinct'),
    withheld: offerable.filter((fn) => fn === 'countDistinct'),
  };
};
