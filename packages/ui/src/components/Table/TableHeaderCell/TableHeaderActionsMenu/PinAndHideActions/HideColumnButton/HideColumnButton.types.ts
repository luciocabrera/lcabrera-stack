import type { DataKey } from '@repo/ui/components/Table/Table.types';

/** Props for the "Hide Column" item of the pin/hide section. */
export type HideColumnButtonProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly onClose: () => void;
};
