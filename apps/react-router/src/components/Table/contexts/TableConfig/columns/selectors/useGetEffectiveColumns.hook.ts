import { useColumnsStore } from '../useColumnsStore.hook.ts';

export const useGetEffectiveColumns = () =>
  useColumnsStore((state) => state.effectiveColumns);
