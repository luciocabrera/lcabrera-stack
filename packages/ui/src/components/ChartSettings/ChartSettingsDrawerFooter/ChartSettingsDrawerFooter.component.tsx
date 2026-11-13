import { ActionButtons } from '#ui/components/ActionButtons';
import { SidePanelFooter } from '#ui/components/SidePanel';

import {
  useAcceptChartSettings,
  useCancelChartSettings,
} from '../contexts/actions';

export const ChartSettingsDrawerFooter = () => {
  const acceptChartSettings = useAcceptChartSettings();
  const cancelChartSettings = useCancelChartSettings();

  return (
    <SidePanelFooter>
      <ActionButtons
        actions={[
          { label: 'Accept', onClick: acceptChartSettings, variant: 'primary' },
          { label: 'Cancel', onClick: cancelChartSettings },
        ]}
      />
    </SidePanelFooter>
  );
};
