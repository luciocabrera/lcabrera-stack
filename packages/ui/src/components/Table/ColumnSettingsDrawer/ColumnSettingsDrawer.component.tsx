import { SidePanel } from '#ui/components/SidePanel';
import {
  useSetTableSettingsPanelWidth,
  useSyncTableSettingsPanelWidth,
} from '#ui/components/Table/contexts/TableConfig/meta/actions';
import {
  useGetTableIsColumnSettingsPinned,
  useGetTableSettingsPanelWidth,
} from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import {
  useGetTableIsLoading,
  useGetTableIsLoadingMore,
} from '#ui/components/Table/contexts/TableData/data/selectors';
import { useTableWrapperRef } from '#ui/components/Table/contexts/TableWrapper';

import { ColumnSettingsDrawerBody } from './ColumnSettingsDrawerBody/ColumnSettingsDrawerBody.component';
import { ColumnSettingsDrawerFooter } from './ColumnSettingsDrawerFooter/ColumnSettingsDrawerFooter.component';
import { ColumnSettingsDrawerHeader } from './ColumnSettingsDrawerHeader/ColumnSettingsDrawerHeader.component';
import { useCancelColumnSettings } from './hooks/useCancelColumnSettings.hook';

export const ColumnSettingsDrawer = () => {
  const isLoading = useGetTableIsLoading();
  const isLoadingMore = useGetTableIsLoadingMore();
  const isPinned = useGetTableIsColumnSettingsPinned();
  const isBusy = isLoading || isLoadingMore;
  const cancelColumnSettings = useCancelColumnSettings({ isBusy });
  const wrapperRef = useTableWrapperRef();
  const panelWidth = useGetTableSettingsPanelWidth();
  const setPanelWidth = useSetTableSettingsPanelWidth();
  const syncPanelWidth = useSyncTableSettingsPanelWidth();

  return (
    <SidePanel
      isOpen={true}
      isPinned={isPinned}
      isResizable
      onClose={cancelColumnSettings}
      onWidthChange={setPanelWidth}
      onWidthCommit={syncPanelWidth}
      portalContainer={wrapperRef}
      position='right'
      size='md'
      {...(panelWidth !== undefined && { width: panelWidth })}
    >
      <ColumnSettingsDrawerHeader />
      <ColumnSettingsDrawerBody />
      <ColumnSettingsDrawerFooter />
    </SidePanel>
  );
};
