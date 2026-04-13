import { useColumnsStore } from '../useColumnsStore.hook.ts';

export const useGetStaticColumnKeys = () =>
  useColumnsStore((state) => state.staticKeys);
