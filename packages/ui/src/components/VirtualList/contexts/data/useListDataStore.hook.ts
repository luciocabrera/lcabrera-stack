import { useStoreSelector } from '@repo/ui/hooks/useStoreSelector.hook';

import type { VirtualListDataStoreState } from '../../VirtualList.types';

import { useVirtualListContextValue } from '../useVirtualListContextValue.hook';
import { INITIAL_LIST_DATA_STATE } from '../VirtualListContext.constants';

export const useListDataStore = <TSelected>(
  selector: (state: VirtualListDataStoreState) => TSelected,
) => {
  const { dataStore } = useVirtualListContextValue();

  return useStoreSelector({
    fallback: INITIAL_LIST_DATA_STATE,
    selector,
    store: dataStore,
  });
};
