import { useListDataStore } from '../useListDataStore.hook';

export const useGetSelectedValues = () =>
  useListDataStore<readonly string[]>((state) => state.selectedValues);
