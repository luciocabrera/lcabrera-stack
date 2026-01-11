import type { ColumnFiltersState, ColumnSizingState } from '@/components/Table';
import type { EnterpriseOrder } from '@/services';

export type EnterpriseOrdersTableProps = {
  columnOrder: string[];
  columnSizing: ColumnSizingState;
  columnVisibility: Set<string>;
  filters?: ColumnFiltersState;
  initialData: EnterpriseOrder[];
  sorting?: { columnKey: string; direction: 'asc' | 'desc' }[];
};
