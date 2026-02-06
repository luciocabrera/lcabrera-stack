import type { ColumnSizingState } from "@/components/Table/Table.types";

import { useColumnsStore } from "../useColumnsStore.hook";

export const useGetColumnSizing = () =>
  useColumnsStore<ColumnSizingState>((state) => state.columnSizing);
