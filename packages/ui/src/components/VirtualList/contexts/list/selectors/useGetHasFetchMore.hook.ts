import { useListStore } from '../useListStore.hook';

/** Whether an infinite-scroll fetch callback was provided. */
export const useGetHasFetchMore = () =>
  useListStore<boolean>((state) => state.hasFetchMore);
