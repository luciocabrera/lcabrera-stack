import { SidePanel } from '@lcabrera/ui/components/SidePanel';
import { useGetTableIsColumnSettingsPinned } from '@lcabrera/ui/components/Table/contexts/TableConfig/meta/selectors';
import {
  useGetTableIsLoading,
  useGetTableIsLoadingMore,
} from '@lcabrera/ui/components/Table/contexts/TableData/data/selectors';
import { useTableWrapperRef } from '@lcabrera/ui/components/Table/contexts/TableWrapper';

import { ColumnSettingsDrawerBody } from './ColumnSettingsDrawerBody/ColumnSettingsDrawerBody.component';
import { ColumnSettingsDrawerFooter } from './ColumnSettingsDrawerFooter/ColumnSettingsDrawerFooter.component';
import { ColumnSettingsDrawerHeader } from './ColumnSettingsDrawerHeader/ColumnSettingsDrawerHeader.component';
import { useCancelColumnSettings } from './hooks/useCancelColumnSettings.hook';

/**
 * Side-panel drawer for editing a single column's settings, composed of a
 * header (column label + pin/close toolbar), a capability-driven tabbed body
 * (General/Filter/Sorting/Pinning/Details), and a footer (Accept/Cancel).
 * Closing the panel cancels pending drawer changes; accept commits without
 * closing, and a pinned drawer always stays open.
 */
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
