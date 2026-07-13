import { useSelectMetaStore } from '../useSelectMetaStore.hook';

/** Whether the list is always visible without a trigger interaction. */
export const useGetIsAlwaysOpen = () =>
  useSelectMetaStore<boolean>((state) => state.isAlwaysOpen);
