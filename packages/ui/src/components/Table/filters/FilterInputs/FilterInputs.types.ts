import type { DataKey } from '#ui/components/Table/Table.types';
import type { ColumnFilter } from '#ui/types/filterOperators.types';

export type FilterInputsProps<TData = Record<string, unknown>> = {
  readonly columnKey: DataKey<TData>;
  readonly filter?: ColumnFilter;
  readonly listMaxHeight?: string;
  readonly onChange: (filter?: ColumnFilter) => void;
  readonly shouldFillHeight?: boolean;
};
