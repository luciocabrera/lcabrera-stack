import { useStore } from '@repo/ui/hooks';
import { useEffect } from 'react';

import type {
  VirtualListConfigState,
  VirtualListUiState,
} from '../../VirtualList.types';
import type {
  VirtualListConfigContextValue,
  VirtualListConfigProviderProps,
} from './VirtualListConfigContext.types';

import { LIST_MAX_HEIGHT } from '../../VirtualList.constants';
import { getInitialListConfigState, getInitialListUiState } from './utils';
import { VirtualListConfigContext } from './VirtualListConfigContext.context';

/**
 * Provides the VirtualList config context: the config store (mirrors the
 * static props via a sync effect), the UI store (owned by the list, written
 * by UI actions), and the parent callbacks for actions/providers.
 */
export const VirtualListConfigProvider = ({
  children,
  hasCheckboxes,
  hasSelectAll,
  listMaxHeight = LIST_MAX_HEIGHT,
  name,
  onChange,
  onFetchInitial,
  onFetchMore,
  shouldFillHeight = false,
}: VirtualListConfigProviderProps) => {
  const configStore = useStore<VirtualListConfigState>(
    getInitialListConfigState({
      hasCheckboxes,
      hasSelectAll,
      listMaxHeight,
      name,
      onFetchInitial,
      onFetchMore,
      shouldFillHeight,
    }),
  );
  const uiStore = useStore<VirtualListUiState>(getInitialListUiState());

  useEffect(() => {
    configStore.set(
      getInitialListConfigState({
        hasCheckboxes,
        hasSelectAll,
        listMaxHeight,
        name,
        onFetchInitial,
        onFetchMore,
        shouldFillHeight,
      }),
    );
  }, [
    configStore,
    hasCheckboxes,
    hasSelectAll,
    listMaxHeight,
    name,
    onFetchInitial,
    onFetchMore,
    shouldFillHeight,
  ]);

  const value: VirtualListConfigContextValue = {
    configStore,
    onChange,
    onFetchInitial,
    onFetchMore,
    uiStore,
  };

  return (
    <VirtualListConfigContext value={value}>
      {children}
    </VirtualListConfigContext>
  );
};
