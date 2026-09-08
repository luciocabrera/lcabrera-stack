import { SidePanelSectionMain } from '#ui/components/SidePanel';

import type { AdvancedSettingsSectionProps } from './AdvancedSettingsSection.types';

import { GroupingModeSection } from './GroupingModeSection';
import { TotalsPlacementSection } from './TotalsPlacementSection';

export const AdvancedSettingsSection = ({
  isBusy = false,
}: AdvancedSettingsSectionProps) => {
  return (
    <SidePanelSectionMain>
      <GroupingModeSection isBusy={isBusy} />
      <TotalsPlacementSection isBusy={isBusy} />
    </SidePanelSectionMain>
  );
};
