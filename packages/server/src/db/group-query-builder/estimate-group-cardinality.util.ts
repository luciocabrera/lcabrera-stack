import type {
  ColumnGroupingCapability,
  GroupCardinalityEstimate,
  GroupingMode,
} from './group-query-builder.types.ts';

import { expandGroupingSets } from './expand-grouping-sets.util.ts';

type EstimateGroupCardinalityArgs = {
  readonly capabilities: Readonly<Record<string, ColumnGroupingCapability>>;
  readonly grouping: GroupingMode;
  readonly keys: readonly string[];
};

export const estimateGroupCardinality = ({
  capabilities,
  grouping,
  keys,
}: EstimateGroupCardinalityArgs): GroupCardinalityEstimate => {
  const unknownColumns = keys.filter(
    (key) => capabilities[key]?.distinctEstimate === undefined,
  );

  if (unknownColumns.length > 0) {
    return { columns: unknownColumns, kind: 'unknown' };
  }

  const sets = expandGroupingSets({ grouping, keys });
  const rows = sets.reduce(
    (total, set) =>
      total +
      set.reduce(
        (product, key) => product * (capabilities[key]?.distinctEstimate ?? 1),
        1,
      ),
    0,
  );

  return { kind: 'known', rows };
};
