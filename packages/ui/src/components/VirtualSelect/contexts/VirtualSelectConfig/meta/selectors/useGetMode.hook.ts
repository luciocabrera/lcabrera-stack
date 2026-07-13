import type { VirtualSelectMode } from '../../../../VirtualSelect.types';

import { useSelectMetaStore } from '../useSelectMetaStore.hook';

/** Selection mode: single closes on pick, multi shows checkboxes/tags. */
export const useGetMode = () =>
  useSelectMetaStore<VirtualSelectMode>((state) => state.mode);
