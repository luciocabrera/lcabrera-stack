import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetEffectiveColumns = () =>
  useColumnsStore((state) => state.effectiveColumns);
