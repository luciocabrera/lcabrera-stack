import type { ListFilterMode } from '../../../VirtualList.types';

import { useListStore } from '../useListStore.hook';

/** Active footer filter mode (all / selected / unselected). */
export const useGetListFilterMode = () =>
  useListStore<ListFilterMode>((state) => state.listFilterMode);
