import { SidePanelSectionMain } from '#ui/components/SidePanel';

import type { AdvancedSettingsSectionProps } from './AdvancedSettingsSection.types';

import { ColumnAxisSection } from './ColumnAxisSection';
import { GroupingModeSection } from './GroupingModeSection';
import { TotalsPlacementSection } from './TotalsPlacementSection';

export const AdvancedSettingsSection = ({
  isBusy = false,
}: AdvancedSettingsSectionProps) => {
  return (
    <SidePanelSectionMain>
      <ColumnAxisSection isBusy={isBusy} />
      <GroupingModeSection isBusy={isBusy} />
      <TotalsPlacementSection isBusy={isBusy} />
    </SidePanelSectionMain>
  );
};
