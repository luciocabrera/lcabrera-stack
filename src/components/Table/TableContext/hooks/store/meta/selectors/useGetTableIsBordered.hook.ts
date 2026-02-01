import { useMetaStore } from '@/components/Table/TableContext/hooks/store/meta/useMetaStore.hook';

export const useGetTableIsBordered = () =>
  useMetaStore<boolean>((state) => state.isBordered);
