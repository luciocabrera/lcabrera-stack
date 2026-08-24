import { useListStore } from '../useListStore.hook';

export const useGetListMaxHeight = () =>
  useListStore<string>((state) => state.listMaxHeight);
