import type { DataKey } from '#ui/components/Table/Table.types';

export type PinLeftButtonProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly onClose: () => void;
  readonly pinSide?: 'left' | 'right';
};
