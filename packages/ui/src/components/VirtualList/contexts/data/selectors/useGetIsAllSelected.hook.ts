import { useListDataStore } from '../useListDataStore.hook';

export const useGetIsAllSelected = () =>
  useListDataStore<boolean>((state) => state.isAllSelected);
