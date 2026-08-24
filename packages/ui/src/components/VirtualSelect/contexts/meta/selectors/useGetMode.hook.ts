import type { VirtualSelectMode } from '../../../VirtualSelect.types';

import { useSelectMetaStore } from '../useSelectMetaStore.hook';

export const useGetMode = () =>
  useSelectMetaStore<VirtualSelectMode>((state) => state.mode);
