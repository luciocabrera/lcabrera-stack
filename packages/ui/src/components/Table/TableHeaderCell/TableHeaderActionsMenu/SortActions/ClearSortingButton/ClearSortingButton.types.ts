import type { DataKey } from '#ui/components/Table/Table.types';
import type { SortDirection } from '#ui/types/ui.types';

/** Props for the "Clear Sorting" item of the sorting section. */
export type ClearSortingButtonProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly onClose: () => void;
  readonly sortDirection?: SortDirection;
};
