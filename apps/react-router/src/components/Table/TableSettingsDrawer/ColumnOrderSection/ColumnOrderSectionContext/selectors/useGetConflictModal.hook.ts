import type { ConflictModalState } from '../ColumnOrderSectionContext.types.ts';

import { useModalsStore } from '../useModalsStore.hook.ts';

export const useGetConflictModal = () =>
  useModalsStore<ConflictModalState>((state) => state.conflictModal);
