import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetStaticKeys = () =>
  useColumnsStore<ReadonlySet<string>>((state) => state.staticKeys);
