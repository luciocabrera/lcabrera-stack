import { useListConfigStore } from '../useListConfigStore.hook';

/** Whether an infinite-scroll fetch callback was provided. */
export const useGetHasFetchMore = () =>
  useListConfigStore<boolean>((state) => state.hasFetchMore);
