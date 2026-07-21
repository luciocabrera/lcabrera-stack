import type {
  ColumnFiltersState,
  TableColumn,
} from '@lcabrera/ui/components/Table/Table.types';

type GetSelectedColumnLabelArgs = {
  readonly filterableColumns: readonly TableColumn<Record<string, unknown>>[];
  readonly filters: ColumnFiltersState;
  readonly selectedColumn: string;
};

export const getSelectedColumnLabel = ({
  filterableColumns,
  filters,
  selectedColumn,
}: GetSelectedColumnLabelArgs) => {
  if (!selectedColumn) return [];
  const col = filterableColumns.find((c) => c.key === selectedColumn);
  if (!col) return [];
  const hasActiveFilter = Object.hasOwn(filters, col.key);
  return [hasActiveFilter ? `${col.label} ⚠️ (filtered)` : col.label];
};
