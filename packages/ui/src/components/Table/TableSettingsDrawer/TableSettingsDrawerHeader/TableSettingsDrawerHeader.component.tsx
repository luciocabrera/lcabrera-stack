import { SettingsIcon } from '#ui/components/Icons';
import {
  SidePanelHeader,
  SidePanelHeaderToolbar,
  SidePanelTitle,
} from '#ui/components/SidePanel';
import { useSetTableIsTableSettingsPinned } from '#ui/components/Table/contexts/TableConfig/meta/actions';
import { useGetTableIsTableSettingsPinned } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { ICON_SIZE_LG } from '#ui/design-system/constants';

import type { TableSettingsDrawerHeaderProps } from './TableSettingsDrawerHeader.types';

import { useCancelTableSettings } from '../hooks/useCancelTableSettings.hook';

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
