import type {
  ColumnGroupingCapability,
  GroupingMode,
  GroupKeyPeriod,
} from './group-query-builder.types.ts';

import { GroupingRefusedError } from '../../errors/grouping-refused.error.ts';
import { assertGroupColumn } from './assert-group-column.util.ts';
import { assertGroupDepth } from './assert-group-depth.util.ts';
import { assertGroupKeyPeriods } from './assert-group-key-periods.util.ts';

type AssertGroupKeysArgs = {
  readonly allowedColumns: readonly string[];
  readonly capabilities: Readonly<Record<string, ColumnGroupingCapability>>;
  readonly grouping: GroupingMode;
  readonly keys: readonly string[];
  readonly periods?: Readonly<Record<string, GroupKeyPeriod>>;
};

/**
 * The depth half is delegated to `assertGroupDepth`, which needs no capability map — and
 * that is what lets the executor run it *before any round trip*, so a request past the cap
 * never costs a catalogue query (ADR-066).
 * The builder still runs it too: the pre-flight check is an earlier gate, never the only
 * one.
 */
export const assertGroupKeys = ({
  allowedColumns,
  capabilities,
  grouping,
  keys,
  periods = {},
}: AssertGroupKeysArgs) => {
  assertGroupDepth({ grouping, keys });

  for (const key of keys) {
    assertGroupColumn({ allowedColumns, column: key });

    const capability = capabilities[key];

    if (capability === undefined) {
      throw new GroupingRefusedError({
        column: key,
        message: `No grouping capability was resolved for column "${key}"; it is not a column of this table, or the catalogue could not see it.`,
        reason: 'unknown-column',
      });
    }

    // A key carrying a granularity skips the `canGroup` check entirely, and is
    // judged on that granularity by `assertGroupKeyPeriods` below: a date
    // column is normally refused raw — one group per calendar day — and asking
    // for a month is asking a different question (#786).
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
