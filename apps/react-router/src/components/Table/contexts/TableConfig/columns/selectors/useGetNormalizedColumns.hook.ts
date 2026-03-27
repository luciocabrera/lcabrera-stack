import { useColumnsStore } from "../useColumnsStore.hook.ts";

export const useGetNormalizedColumns = () => useColumnsStore((state) => state.normalizedColumns);
