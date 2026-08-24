import { useGroupingStore } from '../useGroupingStore.hook';

export const useGetGroupingKeys = () => useGroupingStore((state) => state.keys);
