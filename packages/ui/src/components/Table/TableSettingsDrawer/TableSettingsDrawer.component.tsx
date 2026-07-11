import { SidePanel } from '@repo/ui/components/SidePanel';

import type { TableSettingsDrawerProps } from './TableSettingsDrawer.types';

import { useGetTableIsTableSettingsPinned } from '../contexts/TableConfig/meta/selectors';
import { useCancelTableSettings } from './hooks/useCancelTableSettings.hook';
import { TableSettingsDrawerBody } from './TableSettingsDrawerBody/TableSettingsDrawerBody.component';
import { TableSettingsDrawerFooter } from './TableSettingsDrawerFooter/TableSettingsDrawerFooter.component';
import { TableSettingsDrawerHeader } from './TableSettingsDrawerHeader/TableSettingsDrawerHeader.component';

/**
 * Side-panel drawer for editing table settings, composed of a header
 * (title + pin/close toolbar), a tabbed body (General/Filters/Sorting/
 * Columns/Details sections), and a footer (Accept/Cancel). Closing the
 * panel cancels pending drawer changes; a pinned drawer stays open.
 */
export const TableSettingsDrawer = ({
  isBusy = false,
}: TableSettingsDrawerProps) => {
  const cancelTableSettings = useCancelTableSettings({ isBusy });
  const isPinned = useGetTableIsTableSettingsPinned();

  return (
    <SidePanel
      isOpen={true}
      isPinned={isPinned}
      onClose={cancelTableSettings}
      position='right'
      size='md'
    >
      <TableSettingsDrawerHeader isBusy={isBusy} />
      <TableSettingsDrawerBody isBusy={isBusy} />
      <TableSettingsDrawerFooter isBusy={isBusy} />
    </SidePanel>
  );
};
