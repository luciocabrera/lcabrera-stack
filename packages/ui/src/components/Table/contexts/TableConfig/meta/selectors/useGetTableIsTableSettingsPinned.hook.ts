import { useMetaStore } from '#ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableIsTableSettingsPinned = () =>
  useMetaStore<boolean>((state) => state.isTableSettingsPinned);
