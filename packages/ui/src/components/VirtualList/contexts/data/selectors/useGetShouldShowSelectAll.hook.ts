import { useListDataStore } from '../useListDataStore.hook';

/** Whether the "Select All" row is rendered at index 0 of the window. */
export const useGetShouldShowSelectAll = () =>
  useListDataStore<boolean>((state) => state.shouldShowSelectAll);
