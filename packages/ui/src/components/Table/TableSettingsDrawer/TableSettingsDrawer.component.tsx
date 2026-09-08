import { SidePanel } from '#ui/components/SidePanel';

import {
  useSetTableSettingsPanelWidth,
  useSyncTableSettingsPanelWidth,
} from '../contexts/TableConfig/meta/actions';
import {
  useGetTableIsTableSettingsPinned,
  useGetTableSettingsPanelWidth,
} from '../contexts/TableConfig/meta/selectors';
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
  const panelWidth = useGetTableSettingsPanelWidth();
  const setPanelWidth = useSetTableSettingsPanelWidth();
  const syncPanelWidth = useSyncTableSettingsPanelWidth();

  return (
    <SidePanel
      isOpen={true}
      isPinned={isPinned}
      isResizable
      onClose={cancelTableSettings}
      onWidthChange={setPanelWidth}
      onWidthCommit={syncPanelWidth}
      position='right'
      size='md'
      {...(panelWidth !== undefined && { width: panelWidth })}
    >
      <TableSettingsDrawerHeader isBusy={isBusy} />
      <TableSettingsDrawerBody isBusy={isBusy} />
      <TableSettingsDrawerFooter isBusy={isBusy} />
    </SidePanel>
  );
};
