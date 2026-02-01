import { useMetaStore } from '@/components/Table/TableContext/hooks/store/meta/useMetaStore.hook';

export const useGetTableOverscan = () =>
  useMetaStore<number>((state) => state.overscan);
