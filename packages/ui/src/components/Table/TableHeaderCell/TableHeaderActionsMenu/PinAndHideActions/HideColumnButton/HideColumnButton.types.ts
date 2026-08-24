import type { DataKey } from '#ui/components/Table/Table.types';

export type HideColumnButtonProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly onClose: () => void;
};
