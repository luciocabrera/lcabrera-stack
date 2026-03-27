import type { SortingState } from "@/components/Table/Table.types";

import { useColumnsStore } from "../useColumnsStore.hook.ts";

export const useGetColumnsSorting = <TData = Record<string, unknown>>() =>
  useColumnsStore<SortingState<TData>>((state) => state.sorting as SortingState<TData>);
