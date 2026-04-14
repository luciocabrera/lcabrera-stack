import { useMetaStore } from '@/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableIsBordered = () =>
  useMetaStore<boolean>((state) => state.isBordered);
