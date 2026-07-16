import { useMetaStore } from '@repo/ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableTableName = () =>
  useMetaStore<string | undefined>((state) => state.tableName);
