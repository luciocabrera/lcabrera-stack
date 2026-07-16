import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetStaticColumnKeys = () =>
  useColumnsStore((state) => state.staticKeys);
