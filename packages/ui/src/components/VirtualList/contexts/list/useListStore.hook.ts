import { useStoreSelector } from '@lcabrera/ui/hooks/useStoreSelector.hook';

import type { VirtualListState } from '../../VirtualList.types';

import { useVirtualListContextValue } from '../useVirtualListContextValue.hook';

export const useListStore = <TSelected>(
  selector: (state: VirtualListState) => TSelected,
) => {
  const { listStore } = useVirtualListContextValue();

  return useStoreSelector({
    selector,
    store: listStore,
  });
};
