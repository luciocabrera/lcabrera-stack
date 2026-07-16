import type { DataKey } from '@repo/ui/components/Table/Table.types';

/** Props for the pin/hide section of the column header actions menu. */
export type PinAndHideActionsProps<TData> = {
  readonly columnKey: DataKey<TData>;
  /** Whether another section renders above this one (drives the "Pin Left" divider). */
  readonly hasSectionAbove?: boolean;
  readonly onClose: () => void;
  readonly pinSide?: 'left' | 'right';
};
