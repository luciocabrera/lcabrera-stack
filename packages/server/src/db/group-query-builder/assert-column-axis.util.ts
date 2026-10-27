import type {
  ColumnReference,
  ReadScope,
} from '../query-builder/query-builder.types.ts';
import type {
  ColumnAxis,
  ColumnGroupingCapability,
} from './group-query-builder.types.ts';

import { GroupingRefusedError } from '../../errors/grouping-refused.error.ts';
import { toColumnName } from '../query-builder/to-column-name.util.ts';
import { assertColumnAxisKey } from './assert-column-axis-key.util.ts';
import { assertColumnAxisMaxDistinct } from './assert-column-axis-max-distinct.util.ts';
import { POSTGRES_MAX_HEAP_ATTRIBUTES } from './group-query-builder.constants.ts';

type AssertColumnAxisArgs = {
  readonly allowedColumns: readonly string[];
  readonly capabilities: Readonly<Record<string, ColumnGroupingCapability>>;
  readonly columnAxis: ColumnAxis;
  readonly fixedAggregateCount?: number;
  readonly keys: readonly ColumnReference[];
  readonly measureCount: number;
  readonly scope?: ReadScope;
};

export const assertColumnAxis = ({
  allowedColumns,
  capabilities,
  columnAxis,
  fixedAggregateCount = 0,
  keys,
  measureCount,
  scope,
}: AssertColumnAxisArgs) => {
  const { maxDistinct, values } = columnAxis;
  const key = toColumnName(columnAxis.key);

  assertColumnAxisMaxDistinct(maxDistinct);
  assertColumnAxisKey({
    allowedColumns,
    capabilities,
    key: columnAxis.key,
    keys,
    scope,
  });

  if (values.length > maxDistinct) {
    throw new GroupingRefusedError({
      column: key,
      message: `Column "${key}" has ${values.length} distinct values, past the configured ${maxDistinct} column-axis ceiling.`,
      reason: 'column-axis-too-wide',
    });
  }

  const projected =
    keys.length + 1 + fixedAggregateCount + measureCount * values.length;

  if (projected > POSTGRES_MAX_HEAP_ATTRIBUTES) {
    throw new GroupingRefusedError({
      column: key,
      message: `This column axis would project ${projected} attributes, past Postgres's ${POSTGRES_MAX_HEAP_ATTRIBUTES}-attribute heap limit.`,
      reason: 'column-axis-too-wide',
    });
  }
};
