import type { SortingState } from "@/components/Table/Table.types";

import { useColumnsStore } from "../useColumnsStore.hook.ts";

export const useGetColumnsSorting = () => useColumnsStore<SortingState>((state) => state.sorting);
