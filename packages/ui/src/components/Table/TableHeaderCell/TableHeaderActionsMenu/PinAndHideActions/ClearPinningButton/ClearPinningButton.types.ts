import type { DataKey } from '@lcabrera/ui/components/Table/Table.types';

/** Props for the "Clear Pinning" item of the pin/hide section. */
export type ClearPinningButtonProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly onClose: () => void;
  readonly pinSide?: 'left' | 'right';
};
