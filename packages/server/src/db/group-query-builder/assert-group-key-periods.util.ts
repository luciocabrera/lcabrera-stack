import type {
  ColumnGroupingCapability,
  GroupKeyPeriod,
} from './group-query-builder.types.ts';

import { GroupingRefusedError } from '../../errors/grouping-refused.error.ts';

type AssertGroupKeyPeriodsArgs = {
  readonly capabilities: Readonly<Record<string, ColumnGroupingCapability>>;
  readonly keys: readonly string[];
  readonly periods: Readonly<Record<string, GroupKeyPeriod>>;
};

const toAlternatives = (capability: ColumnGroupingCapability) =>
  capability.periods.length === 0
    ? '; it holds no date or timestamp to truncate'
    : `; it offers ${capability.periods.join(', ')}`;

/**
 * Every reason a **granularity** can be refused, checked before anything is emitted
 * (#786).
 * Separate from `assertGroupKeys` rather than folded into its loop, because the two ask
 * different questions of different things: that one walks the keys and asks the catalogue
 * whether each may be grouped, this one walks the granularities and asks whether each
 * names a key that can carry it.
 */
export const assertGroupKeyPeriods = ({
  capabilities,
  keys,
  periods,
}: AssertGroupKeyPeriodsArgs) => {
  const applied = new Set(keys);

  for (const [column, period] of Object.entries(periods)) {
    if (!applied.has(column)) {
      throw new GroupingRefusedError({
        column,
        message: `A granularity was given for column "${column}", which is not one of the group keys.`,
        reason: 'unknown-column',
      });
    }

    const capability = capabilities[column];

    if (capability === undefined || capability.periods.includes(period)) {
      continue;
    }

    throw new GroupingRefusedError({
      column,
      message: `Column "${column}" cannot be grouped by ${period}${toAlternatives(capability)}.`,
      reason: 'column-not-groupable',
    });
  }
};
