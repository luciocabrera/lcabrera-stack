import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { groupingCodec } from './groupingCodec.util';

type SerializeGroupingToURLArgs = {
  readonly grouping: TableGroupingState;
  readonly keepWhenEmpty?: boolean;
};

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
