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

/** What a refusal offers instead, or why there is nothing to offer. */
const toAlternatives = (capability: ColumnGroupingCapability) =>
  capability.periods.length === 0
    ? '; it holds no date or timestamp to truncate'
    : `; it offers ${capability.periods.join(', ')}`;

/**
 * Every reason a **granularity** can be refused, checked before anything is
 * emitted (#786).
 *
 * Separate from `assertGroupKeys` rather than folded into its loop, because the
 * two ask different questions of different things: that one walks the keys and
 * asks the catalogue whether each may be grouped, this one walks the
 * granularities and asks whether each names a key that can carry it.
 *
 * **A granularity naming a column that is not a group key is refused, not
 * ignored.** The two travel as separate members of the same request, so they
 * can disagree; silently dropping one would run a query whose grouping is not
 * the one the URL describes, which is the whole-state rule the URL codec is
 * written under (ADR-061).
 *
 * A column with no capability is left alone here — `assertGroupKeys` refuses it
 * with the more specific message, and reporting "cannot be grouped by month"
 * for a column that is not a column at all would name the wrong problem.
 */
export const assertGroupKeyPeriods = ({
  capabilities,
  keys,
  periods,
}: AssertGroupKeyPeriodsArgs): void => {
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
