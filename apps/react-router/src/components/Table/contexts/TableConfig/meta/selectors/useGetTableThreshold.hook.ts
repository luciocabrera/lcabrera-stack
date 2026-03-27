import { useMetaStore } from "@/components/Table/contexts/TableConfig/meta/useMetaStore.hook";

export const useGetTableThreshold = () => useMetaStore<number>((state) => state.threshold);
