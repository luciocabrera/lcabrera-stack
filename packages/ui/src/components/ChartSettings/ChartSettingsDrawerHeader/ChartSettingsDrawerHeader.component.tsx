import { SettingsIcon } from '#ui/components/Icons';
import {
  SidePanelHeader,
  SidePanelHeaderToolbar,
  SidePanelTitle,
} from '#ui/components/SidePanel';
import { ICON_SIZE_LG } from '#ui/design-system/constants';

import {
  useCancelChartSettings,
  useToggleChartSettingsPinned,
} from '../contexts/actions';
import {
  useGetChartSettingsLabel,
  useGetIsChartSettingsPinned,
} from '../contexts/selectors';

export const ChartSettingsDrawerHeader = () => {
  const cancelChartSettings = useCancelChartSettings();
  const isPinned = useGetIsChartSettingsPinned();
  const label = useGetChartSettingsLabel();
  const toggleChartSettingsPinned = useToggleChartSettingsPinned();

  return (
    <SidePanelHeader
      actions={
        <SidePanelHeaderToolbar
          isPinned={isPinned}
          onClose={cancelChartSettings}
          onTogglePin={toggleChartSettingsPinned}
        />
      }
    >
      <SidePanelTitle icon={<SettingsIcon size={ICON_SIZE_LG} />}>
        {label}
      </SidePanelTitle>
    </SidePanelHeader>
  );
};
