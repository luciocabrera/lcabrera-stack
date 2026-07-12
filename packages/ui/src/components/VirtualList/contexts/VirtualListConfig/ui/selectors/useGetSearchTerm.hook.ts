import { useListUiStore } from '../useListUiStore.hook';

/** Current search term typed into the list header. */
export const useGetSearchTerm = () =>
  useListUiStore<string>((state) => state.searchTerm);
