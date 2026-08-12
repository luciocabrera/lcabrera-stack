import { InfoBox } from '#ui/components/InfoBox';
import {
  SidePanelSection,
  SidePanelSectionHeader,
  SidePanelSectionMain,
} from '#ui/components/SidePanel';

import type { GeneralSettingsSectionProps } from './GeneralSettingsSection.types';

import { ColumnOrderSectionToolbar } from '../ColumnOrderSection/ColumnOrderSectionToolbar';
import { FiltersSectionToolbar } from '../FiltersSection/FiltersSectionToolbar';
import { SortingSectionToolbar } from '../SortingSection/SortingSectionToolbar';
import { AllSettingsSection } from './AllSettingsSection/AllSettingsSection.component';
import { ColumnWidthsSection } from './ColumnWidthsSection/ColumnWidthsSection.component';

/**
 * "General" tab of the table settings drawer: column width presets, the
 * footer-variant clear/reset toolbars of the Filters/Sorting/Columns
 * sections, and the cross-section clear/reset-all actions.
 */
export const GeneralSettingsSection = ({
  isBusy = false,
  ...props
}: GeneralSettingsSectionProps) => {
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

      <AllSettingsSection isBusy={isBusy} />
    </SidePanelSectionMain>
  );
};
