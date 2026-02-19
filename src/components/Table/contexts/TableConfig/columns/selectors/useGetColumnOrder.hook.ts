import type { ColumnOrderState } from "@/components/Table/Table.types";

import { useColumnsStore } from "../useColumnsStore.hook";

export const useGetColumnOrder = <TData>() =>
  useColumnsStore<ColumnOrderState<TData>>((state) => state.columnOrder);
