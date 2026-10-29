import type {
  ColumnReference,
  ReadScope,
} from '../query-builder/query-builder.types.ts';
import type { ColumnGroupingCapability } from './group-query-builder.types.ts';

import { GroupingRefusedError } from '../../errors/grouping-refused.error.ts';
import { toColumnName } from '../query-builder/to-column-name.util.ts';
import { assertGroupColumn } from './assert-group-column.util.ts';

type AssertColumnAxisKeyArgs = {
  readonly allowedColumns: readonly string[];
  readonly capabilities: Readonly<Record<string, ColumnGroupingCapability>>;
  readonly key: ColumnReference;
  readonly keys: readonly ColumnReference[];
  readonly scope?: ReadScope;
};

export const assertColumnAxisKey = ({
  allowedColumns,
  capabilities,
  key: reference,
  keys,
  scope,
}: AssertColumnAxisKeyArgs) => {
  const key = toColumnName(reference);

  if (keys.some((entry) => toColumnName(entry) === key)) {
    throw new GroupingRefusedError({
      column: key,
      message: `Column "${key}" cannot be a row key and a column axis at once.`,
      reason: 'duplicate-keys',
    });
  }

  assertGroupColumn({ allowedColumns, column: reference, scope });

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
