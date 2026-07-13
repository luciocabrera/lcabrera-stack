import { useListConfigStore } from '../useListConfigStore.hook';

/** Whether an initial-fetch callback was provided. */
export const useGetHasFetchInitial = () =>
  useListConfigStore<boolean>((state) => state.hasFetchInitial);
