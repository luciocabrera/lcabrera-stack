import { useSetTableIsTableSettingsOpen } from '#ui/components/Table/contexts/TableConfig/meta/actions';
import { useGetTableIsTableSettingsPinned } from '#ui/components/Table/contexts/TableConfig/meta/selectors';

/**
 * Returns a handler that closes the table settings drawer unless it is
 * pinned. Shared by the accept and cancel flows so a pinned drawer always
 * stays open after committing or discarding changes.
 */
export const useCloseTableSettingsIfUnpinned = () => {
  const isPinned = useGetTableIsTableSettingsPinned();
  const setTableIsTableSettingsOpen = useSetTableIsTableSettingsOpen();

  return () => {
    if (!isPinned) {
      setTableIsTableSettingsOpen(false);
    }
  };
};
