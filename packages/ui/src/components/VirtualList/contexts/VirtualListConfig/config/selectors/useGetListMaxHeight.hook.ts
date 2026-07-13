import { useListConfigStore } from '../useListConfigStore.hook';

/** CSS max-height of the scrollable list container. */
export const useGetListMaxHeight = () =>
  useListConfigStore<string>((state) => state.listMaxHeight);
