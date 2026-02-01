import { useMetaStore } from '@/components/Table/TableContext/hooks/store/meta/useMetaStore.hook';

export const useGetTableThreshold = () =>
  useMetaStore<number>((state) => state.threshold);