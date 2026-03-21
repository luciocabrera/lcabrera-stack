import type { TableColumn } from '@/components/Table/Table.types';

type GetSelectedColumnLabelArgs = {
  readonly selectedColumn: string;
  readonly sortableColumns: TableColumn<Record<string, unknown>>[];
};

export const getSelectedColumnLabel = ({
  selectedColumn,
  sortableColumns,
}: GetSelectedColumnLabelArgs) => {
  if (!selectedColumn) return [];
  const col = sortableColumns.find((c) => c.key === selectedColumn);
  return col ? [col.label] : [];
};
