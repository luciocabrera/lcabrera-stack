import type { PinSideModalState } from '../ColumnOrderSectionContext.types';

import { useModalsStore } from '../useModalsStore.hook';

export const useGetPinSideModal = () =>
  useModalsStore<PinSideModalState>((state) => state.pinSideModal);
