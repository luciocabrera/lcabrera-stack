import { useMetaStore } from "@/components/Table/contexts/TableConfig/meta/useMetaStore.hook";

export const useGetTablePlaceholderRowCount = () =>
  useMetaStore<number>((state) => state.placeholderRowCount);
