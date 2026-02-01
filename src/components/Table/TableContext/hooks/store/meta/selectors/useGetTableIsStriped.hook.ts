import { useMetaStore } from '@/components/Table/TableContext/hooks/store/meta/useMetaStore.hook';

export const useGetTableIsStriped = () =>
  useMetaStore<boolean>((state) => state.isStriped);
