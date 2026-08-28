import type { RadioOption } from '#ui/components/RadioOptionGroup';
import type {
  TableColumn,
  TableColumnAggregate,
  TableColumnGroupingCapability,
} from '#ui/components/Table/Table.types';

import { MAX_TABLE_GROUP_KEYS } from '#ui/components/Table/Table.constants';
import { resolveGroupKeyAvailability } from '#ui/components/Table/utils/resolveGroupKeyAvailability.util';

import type { ColumnGroupingChoice } from '../ColumnOrderSection.types';

import { resolveAddableAggregates } from '../../GroupingSection/utils';

type ResolveColumnGroupingChoicesArgs<TData> = {
  readonly aggregates: readonly TableColumnAggregate[];
  readonly capability: TableColumnGroupingCapability | undefined;
  readonly column: TableColumn<TData> | undefined;
  readonly groupingKeys: readonly string[];
};

/**
 * What a column may join the grouping as, from the same resolvers the Grouping tab's own
 * pickers read (ADR-058, ADR-080) — empty means the grouping cannot show it at all.
 */
export const resolveColumnGroupingChoices = <TData>({
  aggregates,
  capability,
  column,
  groupingKeys,
}: ResolveColumnGroupingChoicesArgs<TData>): readonly RadioOption<ColumnGroupingChoice>[] => {
  if (column === undefined) return [];

  const columnKey = String(column.key);
  const { isGroupable } = resolveGroupKeyAvailability<TData>({
    capability,
    column,
  });
  const canAddGroupKey =
    isGroupable &&
    !groupingKeys.includes(columnKey) &&
    groupingKeys.length < MAX_TABLE_GROUP_KEYS;
  const { options } = resolveAddableAggregates({
    applied: aggregates,
    capability,
    columnKey,
    isGroupKey: groupingKeys.includes(columnKey),
  });

  return [
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
    ...options.map((option) => ({
      description: `Renders one column summarising each group by ${option.label.toLowerCase()}.`,
      label: option.label,
      value: option.value,
    })),
  ];
};
