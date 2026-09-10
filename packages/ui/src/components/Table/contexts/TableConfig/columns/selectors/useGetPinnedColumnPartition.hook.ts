import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetPinnedColumnPartition = () =>
  useColumnsStore((state) => state.pinnedColumnPartition);
