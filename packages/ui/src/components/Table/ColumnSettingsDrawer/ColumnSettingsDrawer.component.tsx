import { SidePanel } from '@repo/ui/components/SidePanel';
import { useGetTableIsColumnSettingsPinned } from '@repo/ui/components/Table/contexts/TableConfig/meta/selectors';
import { useTableWrapperRef } from '@repo/ui/components/Table/contexts/TableWrapper';

import type { ColumnSettingsDrawerProps } from './ColumnSettingsDrawer.types';

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
export const ColumnSettingsDrawer = <TData extends Record<string, unknown>>({
  columnKey,
  isBusy = false,
}: ColumnSettingsDrawerProps<TData>) => {
  const cancelColumnSettings = useCancelColumnSettings({ isBusy });
  const isPinned = useGetTableIsColumnSettingsPinned();
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
      <ColumnSettingsDrawerHeader<TData>
        columnKey={columnKey}
        isBusy={isBusy}
      />
      <ColumnSettingsDrawerBody<TData> columnKey={columnKey} isBusy={isBusy} />
      <ColumnSettingsDrawerFooter isBusy={isBusy} />
    </SidePanel>
  );
};
