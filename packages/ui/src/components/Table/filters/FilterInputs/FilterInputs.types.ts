import type { DataKey } from '@repo/ui/components/Table/Table.types';
import type { ColumnFilter } from '@repo/ui/types/filterOperators.types';

export type FilterInputsProps<TData = Record<string, unknown>> = {
  /** Column key to identify which filter data to use from context */
  readonly columnKey: DataKey<TData>;
  /** Current filter value */
  readonly filter?: ColumnFilter;
  /** Max height for the virtual options list (CSS value, e.g. '12rem') */
  readonly listMaxHeight?: string;
  /** Callback when filter changes */
  readonly onChange: (filter?: ColumnFilter) => void;
  /** When true, the component expands to fill all available vertical space */
  readonly shouldFillHeight?: boolean;
};
