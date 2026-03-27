import { useColumnsStore } from "../useColumnsStore.hook.ts";

export const useGetColumnPinning = () =>
  useColumnsStore<"left" | "right" | undefined>((state) => state.columnPinning);
