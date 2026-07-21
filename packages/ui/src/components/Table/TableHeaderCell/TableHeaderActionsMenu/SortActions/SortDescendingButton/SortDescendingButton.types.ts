import type { DataKey } from '@lcabrera/ui/components/Table/Table.types';
import type { SortDirection } from '@lcabrera/ui/types/ui.types';

/** Props for the "Descending" item of the sorting section. */
export type SortDescendingButtonProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly onClose: () => void;
  readonly sortDirection?: SortDirection;
};
