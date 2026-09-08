import { SidePanelSectionMain } from '#ui/components/SidePanel';
import { useGetTableIsGroupingEnabled } from '#ui/components/Table/contexts/TableConfig/meta/selectors';

import type { AdvancedSettingsSectionProps } from './AdvancedSettingsSection.types';

import { GroupingModeSection } from './GroupingModeSection';
import { TabsOrderSection } from './TabsOrderSection';
import { TotalsPlacementSection } from './TotalsPlacementSection';

export const AdvancedSettingsSection = ({
  isBusy = false,
}: AdvancedSettingsSectionProps) => {
  const isGroupingEnabled = useGetTableIsGroupingEnabled();

  return (
    <SidePanelSectionMain>
      {isGroupingEnabled && (
        <>
          <GroupingModeSection isBusy={isBusy} />
          <TotalsPlacementSection isBusy={isBusy} />
        </>
      )}

      <TabsOrderSection isBusy={isBusy} />
    </SidePanelSectionMain>
  );
};
