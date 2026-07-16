import { useMetaStore } from '@repo/ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTablePersistenceKey = () =>
  useMetaStore<string>((state) => state.persistenceKey);
