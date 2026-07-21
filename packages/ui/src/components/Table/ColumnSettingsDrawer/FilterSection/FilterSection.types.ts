import type { DataKey } from '@lcabrera/ui/components/Table/Table.types';

export type FilterSectionProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly isBusy?: boolean;
};
