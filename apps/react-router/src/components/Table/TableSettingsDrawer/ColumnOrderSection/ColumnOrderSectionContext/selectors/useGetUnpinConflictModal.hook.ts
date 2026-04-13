import type { ConflictModalState } from '../ColumnOrderSectionContext.types.ts';

import { useModalsStore } from '../useModalsStore.hook.ts';

export const useGetUnpinConflictModal = () =>
  useModalsStore<ConflictModalState>((state) => state.unpinConflictModal);
