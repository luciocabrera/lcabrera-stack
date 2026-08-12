import type { DataKey } from '#ui/components/Table/Table.types';
import type { SortDirection } from '#ui/types/ui.types';

export type TableHeaderActionsMenuProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly columnLabel: string;
  readonly hasSettings: boolean;
  readonly isSortable: boolean;
  readonly isStatic: boolean;
  readonly pinSide?: 'left' | 'right';
  readonly sortDirection?: SortDirection;
};
