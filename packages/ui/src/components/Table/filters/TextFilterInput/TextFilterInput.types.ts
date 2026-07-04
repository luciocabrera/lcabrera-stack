import type { DataKey } from '@repo/ui/components/Table/Table.types';
import type { TextFilter } from '@repo/ui/types/filterOperators.types';

export type TextFilterInputProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly filter?: TextFilter;
  readonly onChange: (filter?: TextFilter) => void;
  /** The operator is now controlled by FilterInputs */
  readonly operator: TextFilter['operator'];
};
