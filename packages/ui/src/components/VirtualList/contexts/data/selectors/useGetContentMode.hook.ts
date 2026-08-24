import type { VirtualListContentMode } from '../../../VirtualList.types';

import { useListDataStore } from '../useListDataStore.hook';

export const useGetContentMode = () =>
  useListDataStore<VirtualListContentMode>((state) => state.contentMode);
