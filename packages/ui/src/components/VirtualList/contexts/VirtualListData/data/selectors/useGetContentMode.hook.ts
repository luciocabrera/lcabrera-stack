import type { VirtualListContentMode } from '../../../../VirtualList.types';

import { useListDataStore } from '../useListDataStore.hook';

/** Body content mode: loading skeleton, empty message, or the options list. */
export const useGetContentMode = () =>
  useListDataStore<VirtualListContentMode>((state) => state.contentMode);
