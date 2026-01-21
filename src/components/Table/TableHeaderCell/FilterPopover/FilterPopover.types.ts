import type { ColumnFilter, TableColumn } from '../../Table.types';

export type FilterPopoverProps = {
  column: TableColumn;
  fetchFilterOptions?: (
    offset?: number,
  ) => Promise<{ hasMore: boolean; values: string[] }>;
  filter?: ColumnFilter;
  filterOptions?: string[];
  onApply: (filter?: ColumnFilter) => void;
  onClear: () => void;
  popoverId: string;
};

// Type for popover toggle event
export type ToggleEvent = Event & {
  newState: 'closed' | 'open';
};
