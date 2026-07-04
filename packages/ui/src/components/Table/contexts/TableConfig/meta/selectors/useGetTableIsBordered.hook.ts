import { useMetaStore } from '@repo/ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableIsBordered = () =>
  useMetaStore<boolean>((state) => state.isBordered);
