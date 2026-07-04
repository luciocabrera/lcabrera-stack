import { useDataStore } from '../useDataStore.hook';

export const useGetTableData = <TData>() =>
  useDataStore<readonly TData[], TData>((state) => state.data);
