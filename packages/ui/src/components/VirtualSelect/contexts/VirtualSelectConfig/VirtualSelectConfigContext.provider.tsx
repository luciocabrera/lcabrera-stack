import { useStore } from '@repo/ui/hooks';
import { useEffect } from 'react';

import type { VirtualSelectMetaState } from '../../VirtualSelect.types';
import type {
  VirtualSelectConfigContextValue,
  VirtualSelectConfigProviderProps,
} from './VirtualSelectConfigContext.types';

import { getInitialSelectMetaState } from './utils';
import { VirtualSelectConfigContext } from './VirtualSelectConfigContext.context';

/**
 * Provides the VirtualSelect config context: the meta store (mirrors the
 * shell-owned presentation metadata via a sync effect, with `isListVisible`
 * pre-computed) and the shell's dropdown-toggle callback for actions.
 */
export const VirtualSelectConfigProvider = ({
  children,
  customStylex,
  isAlwaysOpen,
  isBusy,
  isOpen,
  listboxId,
  listMaxHeight,
  mode,
  onToggleDropdown,
  placeholder,
  shouldFillHeight,
}: VirtualSelectConfigProviderProps) => {
  const metaStore = useStore<VirtualSelectMetaState>(
    getInitialSelectMetaState({
      customStylex,
      isAlwaysOpen,
      isBusy,
      isOpen,
      listboxId,
      listMaxHeight,
      mode,
      placeholder,
      shouldFillHeight,
    }),
  );

  useEffect(() => {
    metaStore.set(
      getInitialSelectMetaState({
        customStylex,
        isAlwaysOpen,
        isBusy,
        isOpen,
        listboxId,
        listMaxHeight,
        mode,
        placeholder,
        shouldFillHeight,
      }),
    );
  }, [
    customStylex,
    isAlwaysOpen,
    isBusy,
    isOpen,
    listboxId,
    listMaxHeight,
    metaStore,
    mode,
    placeholder,
    shouldFillHeight,
  ]);

  const value: VirtualSelectConfigContextValue = {
    metaStore,
    onToggleDropdown,
  };

  return (
    <VirtualSelectConfigContext value={value}>
      {children}
    </VirtualSelectConfigContext>
  );
};
