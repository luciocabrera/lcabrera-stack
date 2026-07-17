import type { DataKey } from '@repo/ui/components/Table/Table.types';

export type ResizeHandleProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly columnLabel: string;
};
