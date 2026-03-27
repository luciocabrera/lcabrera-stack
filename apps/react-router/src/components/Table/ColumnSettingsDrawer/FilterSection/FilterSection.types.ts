import type { DataKey } from "@/components/Table/Table.types";

export type FilterSectionProps<TData> = {
  readonly columnKey: DataKey<TData>;
};
