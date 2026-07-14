import type { DataKey } from '@repo/ui/components/Table/Table.types';

/** Props for the "Pin Left" item of the pin/hide section. */
export type PinLeftButtonProps<TData> = {
  readonly columnKey: DataKey<TData>;
  /** Whether another section renders above this one (drives the divider). */
  readonly hasSectionAbove?: boolean;
  readonly onClose: () => void;
  readonly pinSide?: 'left' | 'right';
};
