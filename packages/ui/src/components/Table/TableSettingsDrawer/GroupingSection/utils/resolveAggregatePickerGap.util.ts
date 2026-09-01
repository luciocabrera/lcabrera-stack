import type { TableAggregateFn } from '#ui/components/Table/Table.types';

import type { AggregatePickerGap } from '../GroupingSection.types';

type ResolveAggregatePickerGapArgs = {
  readonly affordable: readonly TableAggregateFn[];
  readonly appliedFns: ReadonlySet<TableAggregateFn>;
  readonly hasOptions: boolean;
  readonly withheld: readonly TableAggregateFn[];
};

export const resolveAggregatePickerGap = ({
  affordable,
  appliedFns,
  hasOptions,
  withheld,
}: ResolveAggregatePickerGapArgs): AggregatePickerGap | undefined => {
  if (hasOptions) return;
  if (withheld.some((fn) => !appliedFns.has(fn))) return 'count-distinct-spent';
  if (affordable.length > 0) return 'column-exhausted';
};
