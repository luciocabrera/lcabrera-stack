import type { DataKey } from '#ui/components/Table/Table.types';
import type { SelectFilter } from '#ui/types/filterOperators.types';

export type SelectFilterInputProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly filter?: SelectFilter;
  readonly listMaxHeight?: string;
  readonly onChange: (filter?: SelectFilter) => void;
  readonly shouldFillHeight?: boolean;
};
