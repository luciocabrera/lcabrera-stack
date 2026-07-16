import { useListStore } from '../useListStore.hook';

/** CSS max-height of the scrollable list container. */
export const useGetListMaxHeight = () =>
  useListStore<string>((state) => state.listMaxHeight);
