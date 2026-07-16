import { SidePanel } from '@repo/ui/components/SidePanel';

import { useGetTableIsTableSettingsPinned } from '../contexts/TableConfig/meta/selectors';
import {
  useGetTableIsLoading,
  useGetTableIsLoadingMore,
} from '../contexts/TableData/data/selectors';
import { useCancelTableSettings } from './hooks/useCancelTableSettings.hook';
import { TableSettingsDrawerBody } from './TableSettingsDrawerBody/TableSettingsDrawerBody.component';
import { TableSettingsDrawerFooter } from './TableSettingsDrawerFooter/TableSettingsDrawerFooter.component';
import { TableSettingsDrawerHeader } from './TableSettingsDrawerHeader/TableSettingsDrawerHeader.component';

export const TableSettingsDrawer = () => {
  const isLoading = useGetTableIsLoading();
  const isLoadingMore = useGetTableIsLoadingMore();
  const isPinned = useGetTableIsTableSettingsPinned();

  const isBusy = isLoading || isLoadingMore;
  const cancelTableSettings = useCancelTableSettings({ isBusy });

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
