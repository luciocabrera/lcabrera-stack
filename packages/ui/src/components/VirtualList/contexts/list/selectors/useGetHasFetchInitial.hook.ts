import { useListStore } from '../useListStore.hook';

/** Whether an initial-fetch callback was provided. */
export const useGetHasFetchInitial = () =>
  useListStore<boolean>((state) => state.hasFetchInitial);
