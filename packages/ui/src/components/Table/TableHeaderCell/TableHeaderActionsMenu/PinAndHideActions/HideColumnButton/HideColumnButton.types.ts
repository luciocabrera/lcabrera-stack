import type { DataKey } from '@lcabrera/ui/components/Table/Table.types';

/** Props for the "Hide Column" item of the pin/hide section. */
export type HideColumnButtonProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly onClose: () => void;
};
