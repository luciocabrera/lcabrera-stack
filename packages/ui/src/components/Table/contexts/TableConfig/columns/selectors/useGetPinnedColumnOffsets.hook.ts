import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetPinnedColumnOffsets = () =>
  useColumnsStore((state) => state.pinnedColumnOffsets);
