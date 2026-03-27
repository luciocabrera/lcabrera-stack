import { useMetaStore } from "@/components/Table/contexts/TableConfig/meta/useMetaStore.hook";

export const useGetTableRowHeight = () => useMetaStore<number>((state) => state.rowHeight);
