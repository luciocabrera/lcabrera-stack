import type { DataKey } from '@lcabrera/ui/components/Table/Table.types';

export type ResizeHandleProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly columnLabel: string;
};
