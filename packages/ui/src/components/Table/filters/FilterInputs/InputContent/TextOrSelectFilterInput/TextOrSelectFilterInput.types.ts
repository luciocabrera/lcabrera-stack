import type { DataKey } from '@repo/ui/components/Table/Table.types';
import type {
  ColumnFilter,
  TextOperatorType,
} from '@repo/ui/types/filterOperators.types';

export type TextOrSelectFilterInputProps<TData> = {
  /** Column key (for stable input names) */
  readonly columnKey: DataKey<TData>;
  /** Current filter value */
  readonly filter?: ColumnFilter;
  /** Whether the column has an async fetcher for filter options */
  readonly hasFetchableOptions: boolean;
  /** Height for the virtual options list (CSS value, e.g. '12rem') */
  readonly listMaxHeight?: string;
  /** Callback when filter changes */
  readonly onChange: (filter?: ColumnFilter) => void;
  readonly operator: TextOperatorType;
  /** When true, the list expands to fill all available vertical space */
  readonly shouldFillHeight: boolean;
};
