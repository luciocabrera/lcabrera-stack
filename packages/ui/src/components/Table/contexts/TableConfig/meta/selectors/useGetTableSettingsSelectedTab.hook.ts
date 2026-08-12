import { useMetaStore } from '#ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableSettingsSelectedTab = () =>
  useMetaStore<string>((state) => state.tableSettingsSelectedTab);
