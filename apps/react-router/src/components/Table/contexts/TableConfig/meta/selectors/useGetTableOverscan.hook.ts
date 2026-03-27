import { useMetaStore } from "@/components/Table/contexts/TableConfig/meta/useMetaStore.hook";

export const useGetTableOverscan = () => useMetaStore<number>((state) => state.overscan);
