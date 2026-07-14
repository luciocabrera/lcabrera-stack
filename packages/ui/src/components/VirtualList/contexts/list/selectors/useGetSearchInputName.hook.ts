import { useListStore } from '../useListStore.hook';

/** Name attribute for the header search input, if provided. */
export const useGetSearchInputName = () =>
  useListStore<string | undefined>((state) => state.name);
