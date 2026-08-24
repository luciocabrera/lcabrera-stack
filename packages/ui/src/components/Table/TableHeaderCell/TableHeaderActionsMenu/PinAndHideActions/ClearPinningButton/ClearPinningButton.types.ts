import type { DataKey } from '#ui/components/Table/Table.types';

export type ClearPinningButtonProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly onClose: () => void;
  readonly pinSide?: 'left' | 'right';
};
