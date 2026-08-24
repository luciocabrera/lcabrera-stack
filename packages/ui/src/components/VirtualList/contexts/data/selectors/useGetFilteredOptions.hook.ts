import { useListDataStore } from '../useListDataStore.hook';

export const useGetFilteredOptions = () =>
  useListDataStore<readonly string[]>((state) => state.filteredOptions);
