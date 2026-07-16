import type { DataKey } from '@repo/ui/components/Table/Table.types';

export type ResizeHandleProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly columnLabel: string;
  readonly currentWidth: number | undefined;
  readonly maxWidth?: number;
  readonly minWidth: number;
};
