import { useListConfigStore } from '../useListConfigStore.hook';

/** Whether the list expands to fill available vertical space. */
export const useGetShouldFillHeight = () =>
  useListConfigStore<boolean>((state) => state.shouldFillHeight);
