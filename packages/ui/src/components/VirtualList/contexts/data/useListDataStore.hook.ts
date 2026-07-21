import { useStoreSelector } from '@lcabrera/ui/hooks/useStoreSelector.hook';

import type { VirtualListDataStoreState } from '../../VirtualList.types';

import { useVirtualListContextValue } from '../useVirtualListContextValue.hook';

export const useListDataStore = <TSelected>(
  selector: (state: VirtualListDataStoreState) => TSelected,
) => {
  const { dataStore } = useVirtualListContextValue();

  return useStoreSelector({
    selector,
    store: dataStore,
  });
};
