import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { groupingCodec } from './groupingCodec.util';

export const deserializeGroupingFromURL = (
  param: string,
): TableGroupingState => {
  const {
    agg = [],
    axis,
    gran = {},
    keys,
    mode = 'flat',
    share = [],
  } = groupingCodec.deserialize(param);

  return {
    aggregates: agg,
    ...(axis !== undefined && { columnAxis: axis }),
    keys,
    mode,
    periods: gran,
    shares: share,
    totalsPlacement: 'last',
  };
};
