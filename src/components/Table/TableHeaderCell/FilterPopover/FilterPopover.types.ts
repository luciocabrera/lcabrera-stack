import type { ColumnFilter, TableColumn } from '@/components/Table';

export type FilterPopoverProps = {
  column: TableColumn;
  fetchFilterOptions?: (offset?: number) => Promise<{ hasMore: boolean; values: string[] }>;
  filter: ColumnFilter | null | undefined;
  filterOptions?: string[];
  onApply: (filter: ColumnFilter | null | undefined) => void;
  onClear: () => void;
  popoverId: string;
};

// Type for popover toggle event
export type ToggleEvent = Event & {
  newState: 'closed' | 'open';
};
