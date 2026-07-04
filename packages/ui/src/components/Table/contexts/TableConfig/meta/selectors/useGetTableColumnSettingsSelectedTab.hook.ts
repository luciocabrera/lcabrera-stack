import { useMetaStore } from '@repo/ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableColumnSettingsSelectedTab = () =>
  useMetaStore<string>((state) => state.columnSettingsSelectedTab);
