import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { groupingCodec } from './groupingCodec.util';

type SerializeGroupingToURLArgs = {
  readonly grouping: TableGroupingState;
  /** True only where the route declared a default grouping — see below. */
  readonly keepWhenEmpty?: boolean;
};

/**
 * Serialize the applied grouping configuration to the compact `grouping` URL param.
 * Returns `undefined` for an empty key list so the caller leaves the param off the URL
 * entirely, the way `serializeSortingToURL` does for an unsorted table — a
 * `grouping={"keys":[]}` in a shared link would say "grouping considered and switched
 * off", which is not a state this table has.
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
