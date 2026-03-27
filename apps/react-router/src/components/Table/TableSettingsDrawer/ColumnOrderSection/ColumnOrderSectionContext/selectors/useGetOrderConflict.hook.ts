import type { OrderConflictModalState } from "../ColumnOrderSectionContext.types.ts";

import { useModalsStore } from "../useModalsStore.hook.ts";

export const useGetOrderConflict = () =>
  useModalsStore<OrderConflictModalState>((state) => state.orderConflict);
