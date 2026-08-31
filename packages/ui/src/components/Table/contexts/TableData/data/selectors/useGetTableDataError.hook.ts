import { useDataStore } from '../useDataStore.hook';

export const useGetTableDataError = () => useDataStore((state) => state.error);
