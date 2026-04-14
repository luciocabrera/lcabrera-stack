import type { ConflictModalState } from '../ColumnOrderSectionContext.types';

import { useModalsStore } from '../useModalsStore.hook';

export const useGetConflictModal = () =>
  useModalsStore<ConflictModalState>((state) => state.conflictModal);
