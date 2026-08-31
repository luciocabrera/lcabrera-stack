import type {
  TableColumnAggregate,
  TableColumnGroupingCapability,
} from '#ui/components/Table/Table.types';

import { TABLE_AGGREGATE_LABELS } from '#ui/components/Table/Table.constants';
import { resolveAffordableAggregates } from '#ui/components/Table/utils/resolveAffordableAggregates.util';

import { resolveAggregatePickerGap } from './resolveAggregatePickerGap.util';

type ResolveAddableAggregatesArgs = {
  readonly applied: readonly TableColumnAggregate[];
  readonly capability: TableColumnGroupingCapability | undefined;
  readonly columnKey: string;
  readonly isGroupKey: boolean;
};

export const resolveAddableAggregates = ({
  applied,
  capability,
  columnKey,
  isGroupKey,
}: ResolveAddableAggregatesArgs) => {
  const { affordable, withheld } = resolveAffordableAggregates({
    applied,
    capability,
    columnKey,
    isGroupKey,
  });
  const appliedFns = new Set(
    applied
      .filter((aggregate) => aggregate.columnKey === columnKey)
      .map((aggregate) => aggregate.fn),
  );
  const options = affordable
    .filter((fn) => !appliedFns.has(fn))
    .map((fn) => ({ label: TABLE_AGGREGATE_LABELS[fn], value: fn }));

  return {
    gap: resolveAggregatePickerGap({
      affordable,
      appliedFns,
      hasOptions: options.length > 0,
      withheld,
    }),
    options,
  };
};
