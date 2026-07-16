import { useListStore } from '../useListStore.hook';

/** Current search term typed into the list header. */
export const useGetSearchTerm = () =>
  useListStore<string>((state) => state.searchTerm);
