import { useMetaStore } from "@/components/Table/contexts/TableConfig/meta/useMetaStore.hook";

export const useGetTableEnablePrefetch = () =>
  useMetaStore<boolean>((state) => state.enablePrefetch);
