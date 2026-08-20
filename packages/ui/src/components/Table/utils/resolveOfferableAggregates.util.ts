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
 * **It deliberately knows nothing about which aggregates are already applied**,
 * and a reader who finds the two surfaces disagreeing on that has found the
 * design rather than drift (#841). Legality is a property of the column, so it
 * is shared; what a surface does with an applied function is a property of its
 * gesture, so it is not. The header menu toggles, so an applied function has to
 * stay on it — that item is the only way to remove one. The drawer's picker only
 * adds, so an applied function there is a choice that cannot change anything,
 * and `resolveAddableAggregates` subtracts them **beside** this predicate rather
 * than inside it. Taking the aggregate list as an argument here would force one
 * answer on both surfaces, and it is the menu that would lose.
 *
 * **It answers per column, and one grouping rule is not a per-column question
 * at all** (#842). How many `countDistinct` aggregates a read may carry is a
 * property of the whole request, so no answer shaped like this one could decide
 * it — the same line `Table.types.ts` draws between `TableGroupKeyRefusalReason`
 * and `TableGroupingRefusalReason`. That rule composes on top, in
 * `resolveAffordableAggregates`, which both offering surfaces call *instead of*
 * this one; taking the whole aggregate list here would make this predicate claim
 * to answer something it cannot see.
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
