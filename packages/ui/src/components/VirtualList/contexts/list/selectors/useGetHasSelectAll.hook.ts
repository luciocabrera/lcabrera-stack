import { useListStore } from '../useListStore.hook';

/** Whether the "Select All" row is enabled by config. */
export const useGetHasSelectAll = () =>
  useListStore<boolean>((state) => state.hasSelectAll);
