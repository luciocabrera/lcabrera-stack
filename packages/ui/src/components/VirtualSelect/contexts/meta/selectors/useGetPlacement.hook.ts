import type { VirtualSelectPlacement } from '../../../VirtualSelect.types';

import { useSelectMetaStore } from '../useSelectMetaStore.hook';

export const useGetPlacement = () =>
  useSelectMetaStore<VirtualSelectPlacement>((state) => state.placement);
