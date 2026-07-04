import type { DataKey } from '@repo/ui/components/Table/Table.types';

export type FilterSectionProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly isBusy?: boolean;
};
