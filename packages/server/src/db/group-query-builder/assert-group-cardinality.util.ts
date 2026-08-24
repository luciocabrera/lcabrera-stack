import type {
  ColumnGroupingCapability,
  GroupCardinalityEstimate,
  GroupCardinalityWarning,
} from './group-query-builder.types.ts';

import { GroupingRefusedError } from '../../errors/grouping-refused.error.ts';
import {
  MAX_GROUP_ROWS_REFUSE,
  MAX_GROUP_ROWS_WARN,
} from './group-query-builder.constants.ts';
import { resolveWidestGroupKey } from './resolve-widest-group-key.util.ts';

type AssertGroupCardinalityArgs = {
  readonly capabilities: Readonly<Record<string, ColumnGroupingCapability>>;
  readonly estimate: GroupCardinalityEstimate;
  readonly keys: readonly string[];
};

/**
 * Three-way verdict on a pre-flight bound: throw `GroupingRefusedError` on refuse, return
 * the warning on warn, `undefined` when there is nothing to say.
 * An unknown estimate warns rather than refusing: statistics are missing on a freshly
 * restored database, and refusing there would make grouping look broken when it is most
 * needed. The refusal names the widest key because "this grouping is too large" leaves a
 * user guessing which column to drop.
 */
export const assertGroupCardinality = ({
  capabilities,
  estimate,
  keys,
}: AssertGroupCardinalityArgs): GroupCardinalityWarning | undefined => {
  if (estimate.kind === 'unknown') {
    return { columns: estimate.columns, kind: 'stats-unavailable' };
  }

  if (estimate.rows > MAX_GROUP_ROWS_REFUSE) {
    const widest = resolveWidestGroupKey({ capabilities, keys });

    throw new GroupingRefusedError({
      estimatedRows: estimate.rows,
      message: `This grouping is estimated to return ${estimate.rows} rows, past the ${MAX_GROUP_ROWS_REFUSE} ceiling.${
        widest === undefined
          ? ''
          : ` Column "${widest.column}" is the widest group key at ${widest.distinctEstimate} distinct values — drop it or filter it down.`
      }`,
      reason: 'estimate-too-large',
      ...(widest !== undefined && { column: widest.column }),
    });
  }

  return estimate.rows > MAX_GROUP_ROWS_WARN
    ? { estimatedRows: estimate.rows, kind: 'estimate-above-warn-threshold' }
    : undefined;
};
