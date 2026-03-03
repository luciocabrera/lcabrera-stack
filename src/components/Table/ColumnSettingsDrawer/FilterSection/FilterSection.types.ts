import type { DataKey } from '@/components/Table/Table.types';

export type FilterSectionProps<TData> = {
  columnKey: DataKey<TData>;
};
