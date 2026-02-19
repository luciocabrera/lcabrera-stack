import { useDataStore } from '../useDataStore.hook';

export const useGetTableData = <TData>() =>
  useDataStore<TData[], TData>((state) => state.data);
