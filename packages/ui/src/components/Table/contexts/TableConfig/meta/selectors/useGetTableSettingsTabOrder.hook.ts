import { useMetaStore } from '#ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableSettingsTabOrder = () =>
  useMetaStore<readonly string[] | undefined>(
    (state) => state.settingsTabOrder,
  );
