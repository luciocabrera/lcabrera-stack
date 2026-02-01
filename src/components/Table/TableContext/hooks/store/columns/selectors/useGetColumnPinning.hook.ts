import type { ColumnPinningState } from "@/components/Table/Table.types";

import { useColumnsStore } from "../useColumnsStore.hook";

export const useGetColumnPinning = () =>
  useColumnsStore<ColumnPinningState>((state) => state.columnPinning);
