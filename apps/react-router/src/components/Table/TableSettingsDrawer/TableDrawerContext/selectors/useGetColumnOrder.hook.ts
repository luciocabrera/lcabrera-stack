import type { ColumnOrderState } from "@/components/Table/Table.types";

import { useColumnsStore } from "../useColumnsStore.hook.ts";

export const useGetColumnOrder = () =>
  useColumnsStore<ColumnOrderState>((state) => state.columnOrder);
