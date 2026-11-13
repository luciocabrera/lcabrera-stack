import { SidePanel } from '#ui/components/SidePanel';

import { ChartSettingsDrawerBody } from '../ChartSettingsDrawerBody/ChartSettingsDrawerBody.component';
import { ChartSettingsDrawerFooter } from '../ChartSettingsDrawerFooter/ChartSettingsDrawerFooter.component';
import { ChartSettingsDrawerHeader } from '../ChartSettingsDrawerHeader/ChartSettingsDrawerHeader.component';
import { useCancelChartSettings } from '../contexts/actions';
import {
  useGetIsChartSettingsOpen,
  useGetIsChartSettingsPinned,
} from '../contexts/selectors';

export const ChartSettingsDrawer = () => {
  const cancelChartSettings = useCancelChartSettings();
  const isOpen = useGetIsChartSettingsOpen();
  const isPinned = useGetIsChartSettingsPinned();

  if (!isOpen) return;

  return (
    <SidePanel
      isOpen
      isPinned={isPinned}
      onClose={cancelChartSettings}
      position='right'
      size='sm'
    >
      <ChartSettingsDrawerHeader />
      <ChartSettingsDrawerBody />
      <ChartSettingsDrawerFooter />
    </SidePanel>
  );
};
