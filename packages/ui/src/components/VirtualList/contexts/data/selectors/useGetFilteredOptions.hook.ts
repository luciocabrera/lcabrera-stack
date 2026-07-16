import { useListDataStore } from '../useListDataStore.hook';

/** Options visible after applying the search term and filter mode. */
export const useGetFilteredOptions = () =>
  useListDataStore<readonly string[]>((state) => state.filteredOptions);
