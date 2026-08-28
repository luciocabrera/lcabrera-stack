import type { RadioOption } from '#ui/components/RadioOptionGroup';
import type {
  TableColumn,
  TableColumnAggregate,
  TableColumnGroupingCapability,
} from '#ui/components/Table/Table.types';

import { MAX_TABLE_GROUP_KEYS } from '#ui/components/Table/Table.constants';
import { resolveGroupKeyAvailability } from '#ui/components/Table/utils/resolveGroupKeyAvailability.util';

import type {
  ColumnGroupingChoice,
  ColumnGroupingRefusal,
} from '../ColumnOrderSection.types';

import { resolveAddableAggregates } from '../../GroupingSection/utils';

type ResolveColumnGroupingChoicesArgs<TData> = {
  readonly aggregates: readonly TableColumnAggregate[];
  readonly capability: TableColumnGroupingCapability | undefined;
  readonly column: TableColumn<TData> | undefined;
  readonly groupingKeys: readonly string[];
};

type ResolveColumnGroupingChoicesResult = {
  readonly options: readonly RadioOption<ColumnGroupingChoice>[];
  readonly refusal: ColumnGroupingRefusal | undefined;
};

export const resolveColumnGroupingChoices = <TData>({
  aggregates,
  capability,
  column,
  groupingKeys,
}: ResolveColumnGroupingChoicesArgs<TData>): ResolveColumnGroupingChoicesResult => {
  if (column === undefined) return { options: [], refusal: 'not-offered' };

  const columnKey = String(column.key);
  const isGroupKey = groupingKeys.includes(columnKey);
  const isAtKeyCap = groupingKeys.length >= MAX_TABLE_GROUP_KEYS;
  const { isGroupable } = resolveGroupKeyAvailability<TData>({
    capability,
    column,
  });
  const canAddGroupKey = isGroupable && !isGroupKey && !isAtKeyCap;
  const { gap, options: aggregateOptions } = resolveAddableAggregates({
    applied: aggregates,
    capability,
    columnKey,
    isGroupKey,
  });

  const options: readonly RadioOption<ColumnGroupingChoice>[] = [
    ...(canAddGroupKey
      ? [
          {
            description:
              'Renders the column as a group key, one level of the grouping.',
            label: 'Group by this column',
            value: 'group-key' as const,
          },
        ]
      : []),
    ...aggregateOptions.map((option) => ({
      description: `Renders one column summarising each group by ${option.label.toLowerCase()}.`,
      label: option.label,
      value: option.value,
    })),
  ];

  if (options.length > 0) return { options, refusal: undefined };
  if (isGroupKey) return { options, refusal: 'already-a-key' };
  if (isGroupable && isAtKeyCap) return { options, refusal: 'key-cap-reached' };
  if (gap !== undefined) return { options, refusal: gap };

  return { options, refusal: 'not-offered' };
};
