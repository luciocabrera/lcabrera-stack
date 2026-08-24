import { useSelectMetaStore } from '../useSelectMetaStore.hook';

export const useGetIsAlwaysOpen = () =>
  useSelectMetaStore<boolean>((state) => state.isAlwaysOpen);
