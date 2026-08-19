import type { TableGroupPeriod } from '#ui/components/Table/Table.types';

type PruneGroupPeriodsArgs = {
  readonly keys: readonly string[];
  readonly periods: Readonly<Record<string, TableGroupPeriod>>;
};

/**
 * The granularities that still name a group key (#786).
 *
 * A granularity describes a key, so one left behind by a removed key describes
 * nothing — and it is not inert: the server refuses a request whose granularity
 * map names a column that is not a group key, so carrying it across would take
 * the whole grouped read down rather than being quietly ignored.
 *
 * The **same object instance** comes back when nothing was dropped, so a caller
 * comparing state by identity does not see a change it did not make.
 */
export const pruneGroupPeriods = ({
  keys,
  periods,
}: PruneGroupPeriodsArgs): Readonly<Record<string, TableGroupPeriod>> => {
  // A Set rather than `keys.includes` inside the filter: the filter is the
  // loop, so an array scan per entry is quadratic — the same reason
  // `AddGroupKeySection` builds one.
  const applied = new Set(keys);
  const kept = Object.entries(periods).filter(([column]) =>
    applied.has(column),
  );

  return kept.length === Object.keys(periods).length
    ? periods
    : Object.fromEntries(kept);
};
