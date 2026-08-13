import { useGroupingStore } from '../useGroupingStore.hook';

/** Which grouping sets the staged configuration would emit. */
export const useGetGroupingMode = () => useGroupingStore((state) => state.mode);
