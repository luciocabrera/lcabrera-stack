import type { ConflictModalState } from '../ColumnOrderSectionContext.types';

import { useModalsStore } from '../useModalsStore.hook';

export const useGetUnpinConflictModal = () =>
  useModalsStore<ConflictModalState>((state) => state.unpinConflictModal);
