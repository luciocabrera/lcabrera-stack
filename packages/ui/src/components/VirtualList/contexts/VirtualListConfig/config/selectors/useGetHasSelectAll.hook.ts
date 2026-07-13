import { useListConfigStore } from '../useListConfigStore.hook';

/** Whether the "Select All" row is enabled by config. */
export const useGetHasSelectAll = () =>
  useListConfigStore<boolean>((state) => state.hasSelectAll);
