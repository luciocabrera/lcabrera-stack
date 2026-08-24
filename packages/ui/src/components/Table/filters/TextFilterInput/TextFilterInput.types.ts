import type { DataKey } from '#ui/components/Table/Table.types';
import type { TextFilter } from '#ui/types/filterOperators.types';

export type TextFilterInputProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly filter?: TextFilter;
  readonly onChange: (filter?: TextFilter) => void;
  readonly operator: TextFilter['operator'];
};
