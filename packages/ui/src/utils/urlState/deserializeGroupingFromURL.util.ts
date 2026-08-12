import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { groupingCodec } from './groupingCodec.util';

/**
 * Read the compact `grouping` URL param back into the grouping configuration.
 *
 * Only the envelope and the aggregate vocabulary are closed here — the keys are
 * still arbitrary strings, and nothing in this step checks them against a
 * table's real columns. That is `sanitizeGroupingByColumns`'s job in the loader
 * path, and the server's `assertGroupKeys` / `assertGroupAggregates` behind it;
 * the three together are why an unusable key never reaches SQL as an identifier.
 */
export const deserializeGroupingFromURL = (
  param: string,
): TableGroupingState => {
  const { agg, keys } = groupingCodec.deserialize(param);

  return { aggregates: agg ?? {}, keys };
};
