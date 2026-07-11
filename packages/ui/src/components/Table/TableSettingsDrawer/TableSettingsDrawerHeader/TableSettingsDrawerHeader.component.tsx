import { SettingsIcon } from '@repo/ui/components/Icons';
import {
  SidePanelHeader,
  SidePanelHeaderToolbar,
  SidePanelTitle,
} from '@repo/ui/components/SidePanel';
import { useSetTableIsTableSettingsPinned } from '@repo/ui/components/Table/contexts/TableConfig/meta/actions';
import { useGetTableIsTableSettingsPinned } from '@repo/ui/components/Table/contexts/TableConfig/meta/selectors';
import { ICON_SIZE_LG } from '@repo/ui/design-system/constants';

import type { TableSettingsDrawerHeaderProps } from './TableSettingsDrawerHeader.types';

import { useCancelTableSettings } from '../hooks/useCancelTableSettings.hook';

/**
 * Header of the table settings drawer: settings icon + title plus the
 * pin/close toolbar. Toggling the pin writes to the table meta store and
 * closing cancels pending drawer changes; both no-op while busy.
 */
export const TableSettingsDrawerHeader = ({
  isBusy = false,
}: TableSettingsDrawerHeaderProps) => {
  const cancelTableSettings = useCancelTableSettings({ isBusy });
  const isPinned = useGetTableIsTableSettingsPinned();
  const setTableIsTableSettingsPinned = useSetTableIsTableSettingsPinned();

  const handleTogglePin = () => {
    if (isBusy) {
      return;
    }

    setTableIsTableSettingsPinned(!isPinned);
  };

  return (
    <SidePanelHeader
      actions={
        <SidePanelHeaderToolbar
          isBusy={isBusy}
          isPinned={isPinned}
          onClose={cancelTableSettings}
          onTogglePin={handleTogglePin}
        />
      }
    >
      <SidePanelTitle icon={<SettingsIcon size={ICON_SIZE_LG} />}>
        Table Settings
      </SidePanelTitle>
    </SidePanelHeader>
  );
};
