import { useMetaStore } from '@/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableColumnSelectedKey = () =>
  useMetaStore((state) => state.columnSelectedKey);
