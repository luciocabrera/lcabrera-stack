import { useListDataStore } from '../useListDataStore.hook';

export const useGetSelectedCount = () =>
  useListDataStore<number>((state) => state.selectedValues.length);
