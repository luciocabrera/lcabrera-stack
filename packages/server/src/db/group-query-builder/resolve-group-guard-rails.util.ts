import type {
  ColumnGroupingCapability,
  GroupGuardRails,
  GroupingMode,
} from './group-query-builder.types.ts';

import { assertGroupCardinality } from './assert-group-cardinality.util.ts';
import { estimateGroupCardinality } from './estimate-group-cardinality.util.ts';
import { resolveGroupRowLimit } from './resolve-group-row-limit.util.ts';

type ResolveGroupGuardRailsArgs = {
  readonly capabilities: Readonly<Record<string, ColumnGroupingCapability>>;
  readonly grouping: GroupingMode;
  readonly keys: readonly string[];
  readonly maxRows: number;
};

/**
 * Throws `GroupingRefusedError` through `assertGroupCardinality` when the bound is past
 * the ceiling.
 */
export const resolveGroupGuardRails = ({
  capabilities,
  grouping,
  keys,
  maxRows,
}: ResolveGroupGuardRailsArgs): GroupGuardRails => {
  const estimate = estimateGroupCardinality({ capabilities, grouping, keys });
  const warning = assertGroupCardinality({ capabilities, estimate, keys });

  return {
    estimate,
    rowLimit: resolveGroupRowLimit({ estimate, maxRows }),
    ...(warning !== undefined && { warning }),
  };
};
