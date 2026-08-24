import { useListStore } from '../useListStore.hook';

export const useGetHasFetchMore = () =>
  useListStore<boolean>((state) => state.hasFetchMore);
