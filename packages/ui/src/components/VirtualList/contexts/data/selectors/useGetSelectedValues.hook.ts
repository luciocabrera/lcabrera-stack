import { useListDataStore } from '../useListDataStore.hook';

/** Currently selected option values (mirror of the controlled `filter` prop). */
export const useGetSelectedValues = () =>
  useListDataStore<readonly string[]>((state) => state.selectedValues);
