import type { DataKey } from '@repo/ui/components/Table/Table.types';
import type { SortDirection } from '@repo/ui/types/ui.types';

/** Props for the "Ascending" item of the sorting section. */
export type SortAscendingButtonProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly onClose: () => void;
  readonly sortDirection?: SortDirection;
};
