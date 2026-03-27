import { useMetaStore } from "@/components/Table/contexts/TableConfig/meta/useMetaStore.hook";

export const useGetTableIsStriped = () => useMetaStore<boolean>((state) => state.isStriped);
