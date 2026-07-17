import { useStoreSelector } from '@repo/ui/hooks/useStoreSelector.hook';

import type { VirtualListState } from '../../VirtualList.types';

import { useVirtualListContextValue } from '../useVirtualListContextValue.hook';
import { INITIAL_LIST_STATE } from '../VirtualListContext.constants';

export const useListStore = <TSelected>(
  selector: (state: VirtualListState) => TSelected,
) => {
  const { listStore } = useVirtualListContextValue();

  return useStoreSelector({
    fallback: INITIAL_LIST_STATE,
    selector,
    store: listStore,
  });
};
