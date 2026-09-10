import type {
  ColumnAxis,
  ColumnGroupingCapability,
} from './group-query-builder.types.ts';

import { GroupingRefusedError } from '../../errors/grouping-refused.error.ts';
import { assertGroupColumn } from './assert-group-column.util.ts';
import { POSTGRES_MAX_HEAP_ATTRIBUTES } from './group-query-builder.constants.ts';

type AssertColumnAxisArgs = {
  readonly allowedColumns: readonly string[];
  readonly capabilities: Readonly<Record<string, ColumnGroupingCapability>>;
  readonly columnAxis: ColumnAxis;
  readonly keys: readonly string[];
  readonly measureCount: number;
};

export const assertColumnAxis = ({
  allowedColumns,
  capabilities,
  columnAxis,
  keys,
  measureCount,
}: AssertColumnAxisArgs) => {
  const { key, maxDistinct, values } = columnAxis;

  assertColumnAxisMaxDistinct(maxDistinct);

  if (keys.includes(key)) {
    throw new GroupingRefusedError({
      column: key,
      message: `Column "${key}" cannot be a row key and a column axis at once.`,
      reason: 'duplicate-keys',
    });
  }

  assertGroupColumn({ allowedColumns, column: key });

  const capability = capabilities[key];

  if (capability === undefined) {
    throw new GroupingRefusedError({
      column: key,
      message: `No grouping capability was resolved for column "${key}"; it is not a column of this table, or the catalogue could not see it.`,
      reason: 'unknown-column',
    });
  }

  if (!capability.canGroup) {
    throw new GroupingRefusedError({
      column: key,
      message: `Column "${key}" is not a legal column axis: ${capability.refusal}.`,
      reason: 'column-not-groupable',
    });
  }

  if (values.length > maxDistinct) {
    throw new GroupingRefusedError({
      column: key,
      message: `Column "${key}" has ${values.length} distinct values, past the configured ${maxDistinct} column-axis ceiling.`,
      reason: 'column-axis-too-wide',
    });
  }

  const projected = keys.length + 1 + measureCount * values.length;

  if (projected > POSTGRES_MAX_HEAP_ATTRIBUTES) {
    throw new GroupingRefusedError({
      column: key,
      message: `This column axis would project ${projected} attributes, past Postgres's ${POSTGRES_MAX_HEAP_ATTRIBUTES}-attribute heap limit.`,
      reason: 'column-axis-too-wide',
    });
  }
};

export const assertColumnAxisMaxDistinct = (maxDistinct: number) => {
  if (!Number.isSafeInteger(maxDistinct) || maxDistinct < 1) {
    throw new Error(
      `columnAxis.maxDistinct must be a positive integer; got ${maxDistinct}.`,
    );
  }
};
