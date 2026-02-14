import type { DataKey } from '@/components/Table/Table.types';

export type FilterPopoverProps<TData> = {
  columnKey: DataKey<TData>;
  popoverId: string;
};

// Type for popover toggle event
export type ToggleEvent = Event & {
  newState: 'closed' | 'open';
};
