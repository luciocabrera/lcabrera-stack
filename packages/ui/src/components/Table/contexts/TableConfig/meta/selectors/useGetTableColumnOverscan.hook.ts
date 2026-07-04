import { useMetaStore } from '@repo/ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableColumnOverscan = () =>
  useMetaStore<number>((state) => state.columnOverscan);
