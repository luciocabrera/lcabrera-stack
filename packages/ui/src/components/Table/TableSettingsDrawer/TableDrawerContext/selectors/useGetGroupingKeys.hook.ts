import { useGroupingStore } from '../useGroupingStore.hook';

/** The group keys staged in the drawer, in nesting order. */
export const useGetGroupingKeys = () => useGroupingStore((state) => state.keys);
