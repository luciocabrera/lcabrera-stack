import { useListDataStore } from '../useListDataStore.hook';

/** Number of currently selected options. */
export const useGetSelectedCount = () =>
  useListDataStore<number>((state) => state.selectedValues.length);
