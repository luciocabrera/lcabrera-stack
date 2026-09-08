import { useMetaStore } from '#ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';
import { resolveSettingsPanelWidth } from '#ui/components/Table/utils/resolveSettingsPanelWidth.util';

export const useGetTableSettingsPanelWidth = () =>
  useMetaStore<number | undefined>((state) =>
    resolveSettingsPanelWidth(state.settingsPanelWidth),
  );
