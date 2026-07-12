import { useListConfigStore } from '../useListConfigStore.hook';

/** Name attribute for the header search input, if provided. */
export const useGetSearchInputName = () =>
  useListConfigStore<string | undefined>((state) => state.name);
