import type { DataKey } from '@lcabrera/ui/components/Table/Table.types';
import type { SortDirection } from '@lcabrera/ui/types/ui.types';

/** Props for the sorting section of the column header actions menu. */
export type SortActionsProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly onClose: () => void;
  readonly sortDirection?: SortDirection;
};
