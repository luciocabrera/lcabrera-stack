import { useListDataStore } from '../useListDataStore.hook';

export const useGetTotalCount = () =>
  useListDataStore<number | undefined>((state) => state.totalCount);
