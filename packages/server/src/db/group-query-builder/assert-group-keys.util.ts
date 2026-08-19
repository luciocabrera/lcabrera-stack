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
 * Every reason a set of group keys can be refused, checked before anything is
 * emitted.
 *
 * The depth half is delegated to `assertGroupDepth`, which needs no capability
 * map — and that is what lets the executor run it *before any round trip*, so a
 * request past the cap never costs a catalogue query (ADR-066). The builder
 * still runs it too: the pre-flight check is an earlier gate, never the only one.
 *
 * The capability lookup is what enforces ADR-058 from inside a pure function:
 * a column the catalogue refused is refused here with the catalogue's own
 * reason, rather than being re-litigated against a type vocabulary that cannot
 * tell `point` from `text`.
 *
 * **A key carrying a granularity is judged on that granularity alone.** The two
 * checks are alternatives rather than a pair, because a date column's raw
 * refusal is the very reason a granularity was asked for: `order_date` is
 * `too-many-distinct` at one group per calendar day and unremarkable at a
 * month, so requiring `canGroup` first would refuse every request this feature
 * exists to serve (#786).
 *
 * **A granularity naming a column that is not a key is refused, not ignored.**
 * The two travel as separate members of the same request, so they can disagree;
 * silently dropping one would run a query whose grouping is not the one the URL
 * describes, which is the whole-state rule the URL codec is written under
 * (ADR-061).
 */
export const assertGroupKeys = ({
  allowedColumns,
  capabilities,
  grouping,
  keys,
  periods = {},
}: AssertGroupKeysArgs): void => {
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
