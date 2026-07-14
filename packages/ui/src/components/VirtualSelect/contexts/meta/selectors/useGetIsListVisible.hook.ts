import { useSelectMetaStore } from '../useSelectMetaStore.hook';

/** Pre-computed dropdown visibility (`isAlwaysOpen || isOpen`). */
export const useGetIsListVisible = () =>
  useSelectMetaStore<boolean>((state) => state.isListVisible);
