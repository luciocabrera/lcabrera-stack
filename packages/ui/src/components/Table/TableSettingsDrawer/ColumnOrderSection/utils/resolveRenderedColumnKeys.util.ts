import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnVisibilityState,
  TableColumn,
  TableColumnAggregate,
} from '#ui/components/Table/Table.types';

import { toDeclaredColumnKey } from '#ui/components/Table/contexts/TableConfig/columns/actions/utils/toDeclaredColumnKey.util';
import { getPinnedDerivedColumnsState } from '#ui/components/Table/utils';

type ResolveRenderedColumnKeysArgs<TData> = {
  readonly aggregates: readonly TableColumnAggregate[];
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly columnVisibility: ColumnVisibilityState<TData>;
  readonly groupingKeys: readonly string[];
};

/**
 * The declared keys the grid paints, in painted order, from the derivation the grid itself
 * renders through — a measure reads as the column it measures (ADR-095).
 */
export const resolveRenderedColumnKeys = <TData>({
  aggregates,
  columnOrder,
  columnPinning,
  columns,
  columnVisibility,
  groupingKeys,
}: ResolveRenderedColumnKeysArgs<TData>): readonly string[] => {
  const { effectiveColumns } = getPinnedDerivedColumnsState<TData>({
    aggregates,
    columnOrder,
    columnPinning,
    columns,
    columnVisibility,
    groupingKeys,
  });

  return [
    ...new Set(
      effectiveColumns.map((column) =>
        String(toDeclaredColumnKey<TData>({ columnKey: column.key, columns })),
      ),
    ),
  ];
};
