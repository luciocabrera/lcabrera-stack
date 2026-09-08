import { useMetaStore } from '#ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableSettingsPanelWidth = () =>
  useMetaStore<number | undefined>((state) => state.settingsPanelWidth);
