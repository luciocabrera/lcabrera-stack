import { useDataStore } from '../useDataStore.hook.ts';

export const useGetTableData = <TData>() =>
  useDataStore<TData[], TData>((state) => state.data);
