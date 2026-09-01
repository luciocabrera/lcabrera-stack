import type { TableGroupPeriod } from '#ui/components/Table/Table.types';

type PruneGroupPeriodsArgs = {
  readonly keys: readonly string[];
  readonly periods: Readonly<Record<string, TableGroupPeriod>>;
};

export const pruneGroupPeriods = ({
  keys,
  periods,
}: PruneGroupPeriodsArgs): Readonly<Record<string, TableGroupPeriod>> => {
  const applied = new Set(keys);
  const kept = Object.entries(periods).filter(([column]) =>
    applied.has(column),
  );

  return kept.length === Object.keys(periods).length
    ? periods
    : Object.fromEntries(kept);
};
