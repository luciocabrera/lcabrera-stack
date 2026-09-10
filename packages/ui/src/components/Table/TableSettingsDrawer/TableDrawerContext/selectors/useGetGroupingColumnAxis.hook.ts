import { useGroupingStore } from '../useGroupingStore.hook';

export const useGetGroupingColumnAxis = () =>
  useGroupingStore((state) => state.columnAxis);
