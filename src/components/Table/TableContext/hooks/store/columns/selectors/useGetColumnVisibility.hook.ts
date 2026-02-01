import type { ColumnVisibilityState } from "@/components/Table/Table.types";

import { useColumnsStore } from "../useColumnsStore.hook";

export const useGetColumnVisibility = () =>
  useColumnsStore<ColumnVisibilityState>((state) => state.columnVisibility);
