import type { ListFilterMode } from '../../../VirtualList.types';

import { useListStore } from '../useListStore.hook';

export const useGetListFilterMode = () =>
  useListStore<ListFilterMode>((state) => state.listFilterMode);
