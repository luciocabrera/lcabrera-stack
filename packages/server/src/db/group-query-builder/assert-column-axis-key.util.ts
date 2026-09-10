import type { ColumnGroupingCapability } from './group-query-builder.types.ts';

import { GroupingRefusedError } from '../../errors/grouping-refused.error.ts';
import { assertGroupColumn } from './assert-group-column.util.ts';

type AssertColumnAxisKeyArgs = {
  readonly allowedColumns: readonly string[];
  readonly capabilities: Readonly<Record<string, ColumnGroupingCapability>>;
  readonly key: string;
  readonly keys: readonly string[];
};

export const assertColumnAxisKey = ({
  allowedColumns,
  capabilities,
  key,
  keys,
}: AssertColumnAxisKeyArgs) => {
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
};
