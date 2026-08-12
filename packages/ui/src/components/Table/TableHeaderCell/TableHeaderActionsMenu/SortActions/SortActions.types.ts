import type { DataKey } from '#ui/components/Table/Table.types';
import type { SortDirection } from '#ui/types/ui.types';

/** Props for the sorting section of the column header actions menu. */
export type SortActionsProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly onClose: () => void;
  readonly sortDirection?: SortDirection;
};
