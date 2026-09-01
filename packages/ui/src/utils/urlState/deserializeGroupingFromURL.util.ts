import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { groupingCodec } from './groupingCodec.util';

export const deserializeGroupingFromURL = (
  param: string,
): TableGroupingState => {
  const { agg, gran, keys, mode, share } = groupingCodec.deserialize(param);

  return {
    aggregates: agg ?? [],
    keys,
    mode: mode ?? 'flat',
    periods: gran ?? {},
    shares: share ?? [],
  };
};
