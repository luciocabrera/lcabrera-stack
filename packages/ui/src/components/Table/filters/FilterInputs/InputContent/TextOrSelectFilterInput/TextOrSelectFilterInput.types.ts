import type { DataKey } from '#ui/components/Table/Table.types';
import type {
  ColumnFilter,
  TextOperatorType,
} from '#ui/types/filterOperators.types';

export type TextOrSelectFilterInputProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly filter?: ColumnFilter;
  readonly hasFetchableOptions: boolean;
  readonly listMaxHeight?: string;
  readonly onChange: (filter?: ColumnFilter) => void;
  readonly operator: TextOperatorType;
  readonly shouldFillHeight: boolean;
};
