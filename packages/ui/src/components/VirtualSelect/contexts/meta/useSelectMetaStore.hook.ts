import { useStoreSelector } from '@repo/ui/hooks/useStoreSelector.hook';

import type { VirtualSelectMetaState } from '../../VirtualSelect.types';

import { useVirtualSelectContextValue } from '../useVirtualSelectContextValue.hook';

export const useSelectMetaStore = <TSelected>(
  selector: (state: VirtualSelectMetaState) => TSelected,
) => {
  const { metaStore } = useVirtualSelectContextValue();

  return useStoreSelector({
    selector,
    store: metaStore,
  });
};
