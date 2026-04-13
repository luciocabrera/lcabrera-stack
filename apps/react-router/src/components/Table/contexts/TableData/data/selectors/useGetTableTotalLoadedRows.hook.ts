import { useDataStore } from '../useDataStore.hook.ts';

export const useGetTableTotalLoadedRows = () =>
  useDataStore<number>((state) => state.totalLoadedRows);
