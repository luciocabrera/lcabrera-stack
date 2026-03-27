import type { ColumnFiltersState } from "@/components/Table/Table.types";

import { useColumnsStore } from "../useColumnsStore.hook.ts";

export const useGetColumnFilters = <TData>() =>
  useColumnsStore<ColumnFiltersState<TData>, TData>((state) => state.columnFilters);
