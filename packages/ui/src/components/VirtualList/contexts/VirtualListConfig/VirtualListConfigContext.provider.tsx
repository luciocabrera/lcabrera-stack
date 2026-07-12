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
  name,
  onChange,
  onFetchInitial,
  onFetchMore,
}: VirtualListConfigProviderProps) => {
  const configStore = useStore<VirtualListConfigState>(
    getInitialListConfigState({
      hasCheckboxes,
      hasSelectAll,
      name,
      onFetchInitial,
      onFetchMore,
    }),
  );
  const uiStore = useStore<VirtualListUiState>(getInitialListUiState());

  useEffect(() => {
    configStore.set(
      getInitialListConfigState({
        hasCheckboxes,
        hasSelectAll,
        name,
        onFetchInitial,
        onFetchMore,
      }),
    );
  }, [
    configStore,
    hasCheckboxes,
    hasSelectAll,
    name,
    onFetchInitial,
    onFetchMore,
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
