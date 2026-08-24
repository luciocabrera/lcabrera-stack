import { useListStore } from '../useListStore.hook';

export const useGetSearchTerm = () =>
  useListStore<string>((state) => state.searchTerm);
