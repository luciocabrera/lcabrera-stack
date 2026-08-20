import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { groupingCodec } from './groupingCodec.util';

/**
 * Read the compact `grouping` URL param back into the grouping configuration.
 *
 * An absent `mode` reads as `flat`, which is what every link written before
 * rollup existed means, and the default the mode control starts from.
 *
 * Only the envelope, the aggregate vocabulary and the mode are closed here — the keys are
 * still arbitrary strings, an aggregate token's column half is any string at
 * all, and nothing in this step checks either against a table's real columns. That is `sanitizeGroupingByColumns`'s job in the loader
 * path, and the server's `assertGroupKeys` / `assertGroupAggregates` behind it;
 * the three together are why an unusable key never reaches SQL as an identifier.
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
