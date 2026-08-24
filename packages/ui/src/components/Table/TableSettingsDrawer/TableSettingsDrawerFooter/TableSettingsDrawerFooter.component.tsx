import { ActionButtons } from '#ui/components/ActionButtons';
import { SidePanelFooter } from '#ui/components/SidePanel';
import { useNotifyAction } from '#ui/contexts/NotificationContext/actions';

import type { TableSettingsDrawerFooterProps } from './TableSettingsDrawerFooter.types';

import { isFilterValid } from '../FiltersSection/utils/isFilterValid.util';
import { useCancelTableSettings } from '../hooks/useCancelTableSettings.hook';
import { useCloseTableSettingsIfUnpinned } from '../hooks/useCloseTableSettingsIfUnpinned.hook';
import { useBatchSetTableDrawerSettings } from '../TableDrawerContext/actions';
import { useGetColumnFilters } from '../TableDrawerContext/selectors';

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
