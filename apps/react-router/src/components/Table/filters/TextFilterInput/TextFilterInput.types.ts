import type { DataKey } from "@/components/Table/Table.types";
import type { TextFilter } from "@/types/filterOperators.types";

export type TextFilterInputProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly filter?: TextFilter | undefined;
  readonly onChange: (filter?: TextFilter) => void;
  /** The operator is now controlled by FilterInputs */
  readonly operator: TextFilter["operator"];
};
