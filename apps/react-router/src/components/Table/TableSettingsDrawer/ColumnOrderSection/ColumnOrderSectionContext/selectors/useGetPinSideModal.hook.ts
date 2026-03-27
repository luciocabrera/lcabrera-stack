import type { PinSideModalState } from "../ColumnOrderSectionContext.types.ts";

import { useModalsStore } from "../useModalsStore.hook.ts";

export const useGetPinSideModal = () =>
  useModalsStore<PinSideModalState>((state) => state.pinSideModal);
