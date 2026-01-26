import type { TableColumn } from '@/components/Table/Table.types';
import type { ColumnFilter } from '@/types/filterOperators.types';

// import type { HandleFilterParams } from '../../TableHeader/TableHeader.types';

export type FilterPopoverProps = {
  column: TableColumn;
  fetchFilterOptions?: (
    offset?: number,
  ) => Promise<{ hasMore: boolean; values: string[] }>;
  filter?: ColumnFilter;
  filterOptions?: string[];
  // onApply: (params: HandleFilterParams) => void;
  // onClear: () => void;
  popoverId: string;
};

// Type for popover toggle event
export type ToggleEvent = Event & {
  newState: 'closed' | 'open';
};
