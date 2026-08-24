import { useSetTableIsTableSettingsOpen } from '#ui/components/Table/contexts/TableConfig/meta/actions';
import { useGetTableIsTableSettingsPinned } from '#ui/components/Table/contexts/TableConfig/meta/selectors';

export const useCloseTableSettingsIfUnpinned = () => {
  const isPinned = useGetTableIsTableSettingsPinned();
  const setTableIsTableSettingsOpen = useSetTableIsTableSettingsOpen();

  return () => {
    if (!isPinned) {
      setTableIsTableSettingsOpen(false);
    }
  };
};
