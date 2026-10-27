import type {
  ColumnReference,
  ReadScope,
} from '../query-builder/query-builder.types.ts';
import type {
  ColumnGroupingCapability,
  GroupingMode,
  GroupKeyPeriod,
} from './group-query-builder.types.ts';

import { GroupingRefusedError } from '../../errors/grouping-refused.error.ts';
import { toColumnName } from '../query-builder/to-column-name.util.ts';
import { assertGroupColumn } from './assert-group-column.util.ts';
import { assertGroupDepth } from './assert-group-depth.util.ts';
import { assertGroupKeyPeriods } from './assert-group-key-periods.util.ts';

type AssertGroupKeysArgs = {
  readonly allowedColumns: readonly string[];
  readonly capabilities: Readonly<Record<string, ColumnGroupingCapability>>;
  readonly grouping: GroupingMode;
  readonly keys: readonly ColumnReference[];
  readonly periods?: Readonly<Record<string, GroupKeyPeriod>>;
  readonly scope?: ReadScope;
};

export const assertGroupKeys = ({
  allowedColumns,
  capabilities,
  grouping,
  keys: references,
  periods = {},
  scope,
}: AssertGroupKeysArgs) => {
  const keys = references.map((reference) => toColumnName(reference));

  assertGroupDepth({ grouping, keys });

  for (const reference of references) {
    const { name: key } = assertGroupColumn({
      allowedColumns,
      column: reference,
      scope,
    });

    const capability = capabilities[key];

    if (capability === undefined) {
      throw new GroupingRefusedError({
        column: key,
        message: `No grouping capability was resolved for column "${key}"; it is not a column of this table, or the catalogue could not see it.`,
        reason: 'unknown-column',
      });
    }

    if (periods[key] !== undefined) continue;

    if (!capability.canGroup) {
      throw new GroupingRefusedError({
        column: key,
        message: `Column "${key}" is not a legal group key: ${capability.refusal}.`,
        reason: 'column-not-groupable',
      });
    }
  }

  assertGroupKeyPeriods({ capabilities, keys, periods });
};
