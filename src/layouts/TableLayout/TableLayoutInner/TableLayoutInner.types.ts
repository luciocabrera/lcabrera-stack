import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
  TableColumn,
  TableDensity,
} from '@/components/Table';

import type { TableLayoutInfiniteScrollConfig } from '../TableLayout.types';

export type TableLayoutInnerProps<TData extends Record<string, unknown>> = {
  columnOrder: ColumnOrderState;
  columns: TableColumn[];
  columnSizing?: ColumnSizingState;
  columnVisibility: ColumnVisibilityState;
  density: TableDensity;
  filters?: ColumnFiltersState;
  infiniteScrollConfig: TableLayoutInfiniteScrollConfig<TData>;
  initialData: TData[];
  isBordered: boolean;
  isStriped: boolean;
  persistenceKey: string;
  sorting?: SortingState;
  title: string;
};
