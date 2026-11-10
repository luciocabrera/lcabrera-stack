import { useListStore } from '../useListStore.hook';

export const useGetHasSelectAll = () =>
  useListStore<boolean>((state) => state.hasSelectAll);
