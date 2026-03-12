import type { OrderConflictModalState } from '../ColumnOrderSectionContext.types';

import { useModalsStore } from '../useModalsStore.hook';

export const useGetOrderConflict = () =>
  useModalsStore<OrderConflictModalState>((state) => state.orderConflict);
