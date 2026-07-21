import { ActionButtons } from '@lcabrera/ui/components/ActionButtons';
import { SidePanelFooter } from '@lcabrera/ui/components/SidePanel';
import { useNotifyAction } from '@lcabrera/ui/contexts/NotificationContext/actions';

import type { TableSettingsDrawerFooterProps } from './TableSettingsDrawerFooter.types';

import { isFilterValid } from '../FiltersSection/utils/isFilterValid.util';
import { useCancelTableSettings } from '../hooks/useCancelTableSettings.hook';
import { useCloseTableSettingsIfUnpinned } from '../hooks/useCloseTableSettingsIfUnpinned.hook';
import { useBatchSetTableDrawerSettings } from '../TableDrawerContext/actions';
import { useGetColumnFilters } from '../TableDrawerContext/selectors';

/**
 * Footer of the table settings drawer: the Accept and Cancel buttons.
 * Accept validates the drawer filters (warning notification on invalid),
 * commits all drawer state to the table, and closes unless pinned; Cancel
 * discards pending changes. Both no-op while busy.
 */
export const TableSettingsDrawerFooter = ({
  isBusy = false,
}: TableSettingsDrawerFooterProps) => {
  const batchSetTableDrawerSettings = useBatchSetTableDrawerSettings();
  const cancelTableSettings = useCancelTableSettings({ isBusy });
  const closeTableSettingsIfUnpinned = useCloseTableSettingsIfUnpinned();
  const notify = useNotifyAction();

  const filters = useGetColumnFilters();
  const areFiltersValid = Object.values(filters).every((f) => isFilterValid(f));

  const handleAccept = () => {
    if (isBusy) {
      return;
    }

    if (!areFiltersValid) {
      notify({
        message: 'Fix invalid filters before accepting table settings.',
        placement: 'bottom-right',
        title: 'Invalid filters',
        variant: 'warning',
      });
      return;
    }

    batchSetTableDrawerSettings();
    closeTableSettingsIfUnpinned();
  };

  return (
    <SidePanelFooter>
      <ActionButtons
        actions={[
          { label: 'Accept', onClick: handleAccept, variant: 'primary' },
          {
            label: 'Cancel',
            onClick: cancelTableSettings,
          },
        ]}
        isBusy={isBusy}
      />
    </SidePanelFooter>
  );
};
