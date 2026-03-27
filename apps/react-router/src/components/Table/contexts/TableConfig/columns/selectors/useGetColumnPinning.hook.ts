import type { ColumnPinningState } from "@/components/Table/Table.types";

import { useColumnsStore } from "../useColumnsStore.hook.ts";

export const useGetColumnPinning = <TData>() =>
  useColumnsStore<ColumnPinningState<TData>, TData>((state) => state.columnPinning);
