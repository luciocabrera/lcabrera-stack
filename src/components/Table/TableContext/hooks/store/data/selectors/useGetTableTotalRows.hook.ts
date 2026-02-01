import { useDataStore } from "../useDataStore.hook";

export const useGetTableTotalRows = () =>
  useDataStore<number>((state) => state.totalRows);
