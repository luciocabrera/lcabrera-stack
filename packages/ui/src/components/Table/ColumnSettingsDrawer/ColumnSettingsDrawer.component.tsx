import { SidePanel } from '#ui/components/SidePanel';
import { useGetTableIsColumnSettingsPinned } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
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

  return (
    <SidePanel
      isOpen={true}
      isPinned={isPinned}
      onClose={cancelColumnSettings}
      portalContainer={wrapperRef}
      position='right'
      size='md'
    >
      <ColumnSettingsDrawerHeader />
      <ColumnSettingsDrawerBody />
      <ColumnSettingsDrawerFooter />
    </SidePanel>
  );
};
