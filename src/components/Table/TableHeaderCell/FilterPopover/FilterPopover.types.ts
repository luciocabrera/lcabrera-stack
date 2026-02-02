import type { TableColumn } from '@/components/Table/Table.types';
import type { ColumnFilter } from '@/types/filterOperators.types';


export type FilterPopoverProps<TData> = {
  column: TableColumn<TData>;
  fetchFilterOptions?: (
    offset?: number,
  ) => Promise<{ hasMore: boolean; values: string[] }>;
  filter?: ColumnFilter;
  filterOptions?: string[];
  popoverId: string;
};

// Type for popover toggle event
export type ToggleEvent = Event & {
  newState: 'closed' | 'open';
};
