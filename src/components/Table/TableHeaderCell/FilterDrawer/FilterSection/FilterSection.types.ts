import type { DataKey } from '@/components/Table/Table.types';
import type { ColumnFilter } from '@/types/filterOperators.types';

export type FilterSectionProps<TData> = {
  columnKey: DataKey<TData>;
  filter: ColumnFilter | undefined;
  onChange: (filter: ColumnFilter | undefined) => void;
};
