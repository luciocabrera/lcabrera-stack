import { useMetaStore } from '@repo/ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableSchemaName = () =>
  useMetaStore<string | undefined>((state) => state.schemaName);
