import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { groupingCodec } from './groupingCodec.util';

/**
 * Read the compact `grouping` URL param back into the grouping configuration.
 * An absent `mode` reads as `flat`, which is what every link written before rollup existed
 * means, and the default the mode control starts from.
 */
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
