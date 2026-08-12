import type { DataKey } from '#ui/components/Table/Table.types';

export type GeneralSectionHeaderProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly isBusy?: boolean;
};
