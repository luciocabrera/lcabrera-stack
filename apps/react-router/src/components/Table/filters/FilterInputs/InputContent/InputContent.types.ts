import type { DataKey, TableColumn } from "@/components/Table/Table.types";
import type { ColumnFilter, OperatorType } from "@/types/filterOperators.types";

export type InputContentProps<TData> = {
  /** Column key (for stable input names) */
  readonly columnKey: DataKey<TData>;
  /** Column configuration */
  readonly dataType: TableColumn<TData>["dataType"];
  /** Current filter value */
  readonly filter?: ColumnFilter;
  /** Whether the column has an async fetcher for filter options */
  readonly hasFetchableOptions: boolean;
  /** Height for the virtual options list (CSS value, e.g. '12rem') */
  readonly listMaxHeight?: string;
  /** Callback when filter changes */
  readonly onChange: (filter?: ColumnFilter) => void;

  readonly operator: OperatorType;
  /** When true, the list expands to fill all available vertical space */
  readonly shouldFillHeight?: boolean;
};
