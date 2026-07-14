import { useListStore } from '../useListStore.hook';

/** Whether the list expands to fill available vertical space. */
export const useGetShouldFillHeight = () =>
  useListStore<boolean>((state) => state.shouldFillHeight);
