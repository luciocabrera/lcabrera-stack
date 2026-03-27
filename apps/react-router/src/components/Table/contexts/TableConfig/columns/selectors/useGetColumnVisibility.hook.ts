import type { ColumnVisibilityState } from "@/components/Table/Table.types";

import { useColumnsStore } from "../useColumnsStore.hook.ts";

export const useGetColumnVisibility = <TData = Record<string, unknown>>() =>
  useColumnsStore<ColumnVisibilityState<TData>>(
    (state) => state.columnVisibility as ColumnVisibilityState<TData>,
  );
