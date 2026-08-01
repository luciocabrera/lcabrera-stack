import type { DataKey } from '@lcabrera/ui/components/Table/Table.types';

/** Props for the pin/hide section of the column header actions menu. */
export type PinAndHideActionsProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly onClose: () => void;
  readonly pinSide?: 'left' | 'right';
};
