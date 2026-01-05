import type { CarSale } from '@/services';
import type { ColumnSizingState } from '@/components/Table';

export type CarSalesTableProps = {
  columnSizing: ColumnSizingState;
  initialData: CarSale[];
  sorting?: { columnKey: string; direction: 'asc' | 'desc' }[];
};
