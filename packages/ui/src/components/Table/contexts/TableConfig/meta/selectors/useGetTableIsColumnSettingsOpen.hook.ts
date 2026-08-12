import { useMetaStore } from '#ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableIsColumnSettingsOpen = () =>
  useMetaStore<boolean>((state) => state.isColumnSettingsOpen);
