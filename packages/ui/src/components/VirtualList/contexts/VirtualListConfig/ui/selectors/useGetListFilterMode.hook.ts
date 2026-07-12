import type { ListFilterMode } from '../../../../VirtualList.types';

import { useListUiStore } from '../useListUiStore.hook';

/** Active footer filter mode (all / selected / unselected). */
export const useGetListFilterMode = () =>
  useListUiStore<ListFilterMode>((state) => state.listFilterMode);
