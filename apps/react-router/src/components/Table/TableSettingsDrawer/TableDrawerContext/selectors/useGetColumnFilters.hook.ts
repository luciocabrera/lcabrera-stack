import type { ColumnFiltersState } from "@/components/Table/Table.types";

import { useColumnsStore } from "../useColumnsStore.hook.ts";

export const useGetColumnFilters = () =>
  useColumnsStore<ColumnFiltersState>((state) => state.columnFilters);
