import { useStoreSelector } from '@repo/ui/hooks/useStoreSelector.hook';

import type { VirtualSelectMetaState } from '../../VirtualSelect.types';

import { useVirtualSelectContextValue } from '../useVirtualSelectContextValue.hook';
import { INITIAL_SELECT_META_STATE } from '../VirtualSelectContext.constants';

export const useSelectMetaStore = <TSelected>(
  selector: (state: VirtualSelectMetaState) => TSelected,
) => {
  const { metaStore } = useVirtualSelectContextValue();

  return useStoreSelector({
    fallback: INITIAL_SELECT_META_STATE,
    selector,
    store: metaStore,
  });
};
