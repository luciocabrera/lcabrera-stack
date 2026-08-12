import type { DataKey } from '#ui/components/Table/Table.types';

/** Props for the "Pin Left" item of the pin/hide section. */
export type PinLeftButtonProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly onClose: () => void;
  readonly pinSide?: 'left' | 'right';
};
