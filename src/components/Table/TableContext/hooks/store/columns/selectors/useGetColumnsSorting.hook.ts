import type { SortingState } from "@/components/Table/Table.types";

import { useColumnsStore } from "../useColumnsStore.hook";

export const useGetColumnsSorting = <TData>() =>
  useColumnsStore<SortingState<TData>>((state) => state.sorting);