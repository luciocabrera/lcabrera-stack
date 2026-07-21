import { useMetaStore } from '@lcabrera/ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableIsTableSettingsOpen = () =>
  useMetaStore<boolean>((state) => state.isTableSettingsOpen);
