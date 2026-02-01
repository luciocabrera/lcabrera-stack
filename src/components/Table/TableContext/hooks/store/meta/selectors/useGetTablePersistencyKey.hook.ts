import { useMetaStore } from "../useMetaStore.hook";

export const useGetTablePersistencyKey = () =>
  useMetaStore<string>((state) => state.persistenceKey);