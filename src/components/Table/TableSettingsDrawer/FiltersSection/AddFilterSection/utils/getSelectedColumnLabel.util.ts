import type {
  ColumnFiltersState,
  TableColumn,
} from '@/components/Table/Table.types';

type GetSelectedColumnLabelArgs = {
  filterableColumns: TableColumn<unknown>[];
  filters: ColumnFiltersState;
  selectedColumn: string;
};

export const getSelectedColumnLabel = ({
  filterableColumns,
  filters,
  selectedColumn,
}: GetSelectedColumnLabelArgs) => {
  if (!selectedColumn) return [];
  const col = filterableColumns.find((c) => c.key === selectedColumn);
  if (!col) return [];
  const hasActiveFilter = Boolean(filters[col.key]);
  return [hasActiveFilter ? `${col.label} ⚠️ (filtered)` : col.label];
};
