import type { DataKey } from '#ui/components/Table/Table.types';

export type PinAndHideActionsProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly onClose: () => void;
  readonly pinSide?: 'left' | 'right';
};
