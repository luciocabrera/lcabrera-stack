import type { ColumnSizingState } from '@/components/Table';
import type { CarSale } from '@/services';

export type CarSalesTableProps = {
  columnOrder: string[];
  columnSizing: ColumnSizingState;
  columnVisibility: Set<string>;
  initialData: CarSale[];
  sorting?: { columnKey: string; direction: 'asc' | 'desc' }[];
};
