import type {
  TableAggregateFn,
  TableColumnGroupingCapability,
} from '../Table.types';

import { orderLegalAggregates } from './orderLegalAggregates.util';

type ResolveOfferableAggregatesArgs = {
  /** What the catalogue said about this column (ADR-058); absent means nothing. */
  readonly capability: TableColumnGroupingCapability | undefined;
  /** Whether this column is one of the group keys **this surface** is showing. */
  readonly isGroupKey: boolean;
};

/** Typed so both exits answer with one array type and callers need no widening. */
const NO_AGGREGATES: readonly TableAggregateFn[] = [];

/**
 * The aggregates a surface may offer for one column, in menu order — the single
 * answer to "may this column be aggregated, and with what".
 *
 * Two conditions, and the point of the util is that they are asked together.
 * The catalogue's per-column answer decides type legality, because
 * `TableColumn.dataType` is a five-member presentation vocabulary that cannot
 * tell a `numeric` from a `jsonb` (ADR-058, #550). An **active group key** is
 * then excluded whatever its type: under one column per key that column renders
 * its key's value, so an aggregate chosen on it could never be shown (ADR-080).
 *
 * The header menu and the drawer's "Add Aggregate" picker both resolve through
 * this, which is what stops them answering differently — the menu offered
 * functions the picker had already dropped, and clicking one wrote a store
 * nothing rendered (#830).
 *
 * Empty means "no aggregate is legal here", never "all of them are", so a
 * surface renders nothing rather than falling back to the whole vocabulary.
 *
 * **This is not where the rule is enforced.** The grouping configuration is URL
 * state, so a request can always name one column as both key and measure;
 * `resolveGroupCellChildren` is where the key actually wins. This only keeps a
 * surface from offering a choice the rendering would then drop.
 */
export const resolveOfferableAggregates = ({
  capability,
  isGroupKey,
}: ResolveOfferableAggregatesArgs) => {
  if (isGroupKey) return NO_AGGREGATES;

  return orderLegalAggregates({ legal: capability?.aggregates ?? [] });
};
