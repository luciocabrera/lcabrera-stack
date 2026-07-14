import { useListDataStore } from '../useListDataStore.hook';

/** Whether every currently visible (filtered) option is selected. */
export const useGetIsAllSelected = () =>
  useListDataStore<boolean>((state) => state.isAllSelected);
