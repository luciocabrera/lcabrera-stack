import { useMetaStore } from "../useMetaStore.hook";

export const useGetTableTitle = () =>
  useMetaStore<string | undefined>((state) => state.title);