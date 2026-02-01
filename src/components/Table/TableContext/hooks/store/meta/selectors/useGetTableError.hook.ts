import { useMetaStore } from "../useMetaStore.hook";

export const useGetTableError = () =>
  useMetaStore<string | undefined>((state) => state.error);
