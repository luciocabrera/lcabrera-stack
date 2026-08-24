import { useListStore } from '../useListStore.hook';

export const useGetShouldFillHeight = () =>
  useListStore<boolean>((state) => state.shouldFillHeight);
