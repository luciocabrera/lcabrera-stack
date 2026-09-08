import { InfoBox } from '#ui/components/InfoBox';
import {
  SidePanelSection,
  SidePanelSectionHeader,
  SidePanelSectionMain,
} from '#ui/components/SidePanel';
import { useGetTableIsGroupingEnabled } from '#ui/components/Table/contexts/TableConfig/meta/selectors';

import type { GeneralSettingsSectionProps } from './GeneralSettingsSection.types';

import { ColumnOrderSectionToolbar } from '../ColumnOrderSection/ColumnOrderSectionToolbar';
import { FiltersSectionToolbar } from '../FiltersSection/FiltersSectionToolbar';
import { GroupingSectionToolbar } from '../GroupingSection/GroupingSectionToolbar';
import { SortingSectionToolbar } from '../SortingSection/SortingSectionToolbar';
import { AllSettingsSection } from './AllSettingsSection/AllSettingsSection.component';
import { ColumnWidthsSection } from './ColumnWidthsSection/ColumnWidthsSection.component';

export const GeneralSettingsSection = ({
  isBusy = false,
  ...props
}: GeneralSettingsSectionProps) => {
  const isGroupingEnabled = useGetTableIsGroupingEnabled();

  return (
    <SidePanelSectionMain {...props}>
      <ColumnWidthsSection isBusy={isBusy} />

      <InfoBox>
        Select a preset to adjust all column widths at once. Changes will be
        reflected after clicking Accept.
      </InfoBox>

      <SidePanelSection>
        <SidePanelSectionHeader title='Filters' />
        <FiltersSectionToolbar isBusy={isBusy} />
      </SidePanelSection>

      <SidePanelSection>
        <SidePanelSectionHeader title='Sorting' />
        <SortingSectionToolbar isBusy={isBusy} />
      </SidePanelSection>

      <SidePanelSection>
        <SidePanelSectionHeader title='Columns' />
        <ColumnOrderSectionToolbar isBusy={isBusy} />
      </SidePanelSection>

      {isGroupingEnabled && (
        <SidePanelSection>
          <SidePanelSectionHeader title='Grouping' />
          <GroupingSectionToolbar isBusy={isBusy} />
        </SidePanelSection>
      )}

      <AllSettingsSection isBusy={isBusy} />
    </SidePanelSectionMain>
  );
};
