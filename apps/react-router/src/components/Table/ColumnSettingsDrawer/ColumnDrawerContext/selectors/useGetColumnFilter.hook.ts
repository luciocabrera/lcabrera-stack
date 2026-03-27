import type { ColumnFilter } from "@/types/filterOperators.types";

import { useColumnsStore } from "../useColumnsStore.hook.ts";

export const useGetColumnFilter = () =>
  useColumnsStore<ColumnFilter | undefined>((state) => state.columnFilter);
