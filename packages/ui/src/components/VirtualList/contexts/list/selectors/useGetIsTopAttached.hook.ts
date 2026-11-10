import { useListStore } from '../useListStore.hook';

export const useGetIsTopAttached = () =>
  useListStore<boolean>((state) => state.isTopAttached);
