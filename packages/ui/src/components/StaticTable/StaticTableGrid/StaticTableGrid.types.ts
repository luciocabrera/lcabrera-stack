import type { StaticTableProps } from '#ui/components/StaticTable/StaticTable.types';
import type { TableColumn } from '#ui/components/Table';

export type StaticTableGridProps<TData extends Record<string, unknown>> =
  StaticTableProps<TData> & {
    readonly columns: readonly TableColumn<TData>[];
  };
