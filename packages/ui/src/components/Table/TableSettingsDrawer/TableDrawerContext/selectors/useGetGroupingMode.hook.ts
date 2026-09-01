import { useGroupingStore } from '../useGroupingStore.hook';

export const useGetGroupingMode = () => useGroupingStore((state) => state.mode);
