import { useMetaStore } from '../useMetaStore.hook';

export const useGetTablePreferredGroupingMode = () =>
  useMetaStore((state) => state.preferredGroupingMode);
