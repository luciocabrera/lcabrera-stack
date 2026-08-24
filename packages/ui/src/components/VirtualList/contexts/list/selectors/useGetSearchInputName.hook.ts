import { useListStore } from '../useListStore.hook';

export const useGetSearchInputName = () =>
  useListStore<string | undefined>((state) => state.name);
