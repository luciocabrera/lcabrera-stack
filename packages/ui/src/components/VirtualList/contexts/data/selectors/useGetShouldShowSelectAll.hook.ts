import { useListDataStore } from '../useListDataStore.hook';

export const useGetShouldShowSelectAll = () =>
  useListDataStore<boolean>((state) => state.shouldShowSelectAll);
