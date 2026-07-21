import type { DataKey } from '@lcabrera/ui/components/Table/Table.types';

/** Props for the "Pin Right" item of the pin/hide section. */
export type PinRightButtonProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly onClose: () => void;
  readonly pinSide?: 'left' | 'right';
};
