import { useMetaStore } from '@repo/ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableThreshold = () =>
  useMetaStore<number>((state) => state.threshold);
