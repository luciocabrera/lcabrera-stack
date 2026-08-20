import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { groupingCodec } from './groupingCodec.util';

type SerializeGroupingToURLArgs = {
  readonly grouping: TableGroupingState;
  /**
   * Whether an empty configuration must still be written. True only where the
   * route declared a default grouping — see below.
   */
  readonly keepWhenEmpty?: boolean;
};

/**
 * Serialize the applied grouping configuration to the compact `grouping` URL
 * param.
 *
 * Returns `undefined` for an empty key list so the caller leaves the param off
 * the URL entirely, the way `serializeSortingToURL` does for an unsorted table
 * — a `grouping={"keys":[]}` in a shared link would say "grouping considered
 * and switched off", which is not a state this table has.
 *
 * A selected aggregate is dropped with the keys for the same reason: an
 * aggregate is computed per group, so with no key there is nothing to aggregate
 * over and nothing to describe. A granularity goes the same way, and has to —
 * it says how a key is grouped, so with no key it names nothing. The mode goes
 * with them — which grouping sets a
 * read emits is not a state an ungrouped table has.
 *
 * **`keepWhenEmpty` is where a route with a default grouping departs from
 * that**, and it is the one table that does have the state above (#578). There,
 * an absent param means "apply the default", so dropping it on clear would put
 * the preset back on the next navigation that wrote any other param. Writing
 * the empty envelope makes "switched off" a thing the URL can say, and it says
 * it only for the routes that need it — everywhere else the param still
 * disappears.
 */
export const serializeGroupingToURL = ({
  grouping: { aggregates, keys, mode, periods, shares },
  keepWhenEmpty = false,
}: SerializeGroupingToURLArgs) => {
  if (keys.length > 0) {
    return groupingCodec.serialize({
      agg: aggregates,
      gran: periods,
      keys,
      mode,
      share: shares,
    });
  }

  return keepWhenEmpty ? groupingCodec.serialize({ keys: [] }) : undefined;
};
