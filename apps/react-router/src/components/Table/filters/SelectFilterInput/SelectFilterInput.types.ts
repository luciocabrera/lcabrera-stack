import type { DataKey } from "@/components/Table/Table.types";
import type { SelectFilter } from "@/types/filterOperators.types";

export type SelectFilterInputProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly filter?: SelectFilter;
  /** Height for the virtual options list (CSS value, e.g. '12rem') */
  readonly listMaxHeight?: string;
  readonly onChange: (filter?: SelectFilter) => void;
  /** When true, the list expands to fill all available vertical space */
  readonly shouldFillHeight?: boolean;
};
