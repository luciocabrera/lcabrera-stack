import type { WidthPreset } from '@repo/ui/components/Table/shared/ColumnWidthPresetButtons';

import { Button } from '@repo/ui/components/Button';
import { EraserIcon, RefreshIcon } from '@repo/ui/components/Icons';
import { InfoBox } from '@repo/ui/components/InfoBox';
import {
  SidePanelSection,
  SidePanelSectionHeader,
  SidePanelSectionMain,
} from '@repo/ui/components/SidePanel';
import { useGetColumns } from '@repo/ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import { ColumnWidthPresetButtons } from '@repo/ui/components/Table/shared/ColumnWidthPresetButtons';
import { ICON_SIZE_MD } from '@repo/ui/design-system/constants';
import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import type { GeneralSettingsSectionProps } from './GeneralSettingsSection.types';

import { ColumnOrderSectionToolbar } from '../ColumnOrderSection/ColumnOrderSectionToolbar';
import { FiltersSectionToolbar } from '../FiltersSection/FiltersSectionToolbar';
import { SortingSectionToolbar } from '../SortingSection/SortingSectionToolbar';
import {
  useClearAllSettings,
  useResetTableSettings,
  useSetColumnsSizing,
} from '../TableDrawerContext/actions';
import { styles } from './GeneralSettingsSection.stylex';

export const GeneralSettingsSection = ({
  isBusy = false,
  ...props
}: GeneralSettingsSectionProps) => {
  const columns = useGetColumns();

  const clearAllSettings = useClearAllSettings();
  const resetTableSettings = useResetTableSettings();
  const setColumnsSizing = useSetColumnsSizing();

  const [selectedPreset, setSelectedPreset] = useState<WidthPreset>();

  const hasMinWidthsConfigured = columns.some((col) => col.minWidth);
  const hasMaxWidthsConfigured = columns.some((col) => col.maxWidth);

  const handleToggle = (preset: 'default' | 'max' | 'min') => {
    const newPreset = selectedPreset === preset ? undefined : preset;
    setSelectedPreset(newPreset);

    if (newPreset === undefined) {
      // Deselected - revert to current state (do nothing)
      return;
    }

    switch (newPreset) {
      case 'default': {
        setColumnsSizing({});

        break;
      }
      case 'max': {
        const newSizing: Record<string, number> = {};
        for (const col of columns) {
          if (col.maxWidth) {
            newSizing[col.key] = col.maxWidth;
          }
        }
        setColumnsSizing(newSizing);

        break;
      }
      case 'min': {
        const newSizing: Record<string, number> = {};
        for (const col of columns) {
          if (col.minWidth) {
            newSizing[col.key] = col.minWidth;
          }
        }
        setColumnsSizing(newSizing);

        break;
      }
      // No default
    }
  };

  const handleToggleDefault = () => handleToggle('default');
  const handleToggleMax = () => handleToggle('max');
  const handleToggleMin = () => handleToggle('min');

  return (
    <SidePanelSectionMain {...props}>
      <SidePanelSection>
        <SidePanelSectionHeader title='Column Widths' />
        <div {...stylex.props(styles.buttonGroup)}>
          <ColumnWidthPresetButtons
            defaultLabel='Reset to Default Widths'
            isBusy={isBusy}
            isMaxDisabled={!hasMaxWidthsConfigured}
            isMinDisabled={!hasMinWidthsConfigured}
            maxLabel='Set All to Max Width'
            minLabel='Set All to Min Width'
            onToggleDefault={handleToggleDefault}
            onToggleMax={handleToggleMax}
            onToggleMin={handleToggleMin}
            selectedPreset={selectedPreset}
          />
        </div>
      </SidePanelSection>

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

      <SidePanelSection>
        <SidePanelSectionHeader title='All Settings' />
        <div {...stylex.props(styles.buttonGroup, styles.generalSection)}>
          <Button
            color='outline'
            icon={<EraserIcon size={ICON_SIZE_MD} />}
            isBusy={isBusy}
            onClick={clearAllSettings}
            size='sm'
            width='full'
          >
            Clear All Settings
          </Button>
          <Button
            color='outline'
            icon={<RefreshIcon size={ICON_SIZE_MD} />}
            isBusy={isBusy}
            onClick={resetTableSettings}
            size='sm'
            width='full'
          >
            Reset All Settings
          </Button>
        </div>
      </SidePanelSection>
    </SidePanelSectionMain>
  );
};
