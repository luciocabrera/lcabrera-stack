import { useEffect } from 'react';

import { VirtualListProvider } from '#ui/components/VirtualList/contexts';
import { useStore } from '#ui/hooks';

import type { VirtualSelectMetaState } from '../VirtualSelect.types';
import type {
  VirtualSelectContextValue,
  VirtualSelectProviderProps,
} from './VirtualSelectContext.types';

import { getInitialSelectMetaState } from './utils';
import { VirtualSelectContext } from './VirtualSelectContext.context';

export const VirtualSelectProvider = ({
  anchorRef,
  children,
  dataState,
  filter,
  listState,
  metaState,
}: VirtualSelectProviderProps) => {
  const metaStore = useStore<VirtualSelectMetaState>(
    getInitialSelectMetaState(metaState),
  );

  useEffect(() => {
    metaStore.set(getInitialSelectMetaState(metaState));
  }, [metaState, metaStore]);

  const value: VirtualSelectContextValue = {
    anchorRef,
    metaStore,
    onCloseDropdown: metaState.onCloseDropdown,
    onToggleDropdown: metaState.onToggleDropdown,
  };

  return (
    <VirtualSelectContext value={value}>
      <VirtualListProvider
        dataState={dataState}
        filter={filter}
        listState={listState}
      >
        {children}
      </VirtualListProvider>
    </VirtualSelectContext>
  );
};
