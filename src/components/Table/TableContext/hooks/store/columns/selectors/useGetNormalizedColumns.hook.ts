import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetNormalizedColumns = () =>
  useColumnsStore((state) => state.normalizedColumns);
