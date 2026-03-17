import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { Button } from '@/components/Button';
import {
  EraserIcon,
  MaximizeIcon,
  MinimizeIcon,
  RefreshIcon,
} from '@/components/Icons';
import { InfoBox } from '@/components/InfoBox';
import {
  SidePanelSection,
  SidePanelSectionHeader,
} from '@/components/SidePanel';
import { useGetColumns } from '@/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import { ICON_SIZE_MD } from '@/design-system/constants';

import type {
  GeneralSettingsSectionProps,
  WidthPreset,
} from './GeneralSettingsSection.types';

import { ColumnOrderSectionFooter } from '../ColumnOrderSection/ColumnOrderSectionFooter';
import { FiltersSectionFooter } from '../FiltersSection/FiltersSectionFooter';
import { SortingSectionFooter } from '../SortingSection/SortingSectionFooter';
import {
  useClearAllSettings,
  useResetTableSettings,
  useSetColumnsSizing,
} from '../TableDrawerContext/actions';
import { styles } from './GeneralSettingsSection.stylex';

export const GeneralSettingsSection = ({
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

  return (
    <div {...stylex.props(styles.container)} {...props}>
      <SidePanelSection>
        <SidePanelSectionHeader title='Column Widths' />
        <div {...stylex.props(styles.buttonGroup)}>
          <Button
            color={selectedPreset === 'min' ? 'primary' : 'outline'}
            disabled={!hasMinWidthsConfigured}
            icon={<MinimizeIcon size={ICON_SIZE_MD} />}
            onClick={() => {
              handleToggle('min');
            }}
            size='sm'
            width='full'
          >
            Set All to Min Width
          </Button>
          <Button
            color={selectedPreset === 'max' ? 'primary' : 'outline'}
            disabled={!hasMaxWidthsConfigured}
            icon={<MaximizeIcon size={ICON_SIZE_MD} />}
            onClick={() => {
              handleToggle('max');
            }}
            size='sm'
            width='full'
          >
            Set All to Max Width
          </Button>
          <Button
            color={selectedPreset === 'default' ? 'primary' : 'outline'}
            icon={<RefreshIcon size={ICON_SIZE_MD} />}
            onClick={() => {
              handleToggle('default');
            }}
            size='sm'
            width='full'
          >
            Reset to Default Widths
          </Button>
        </div>
      </SidePanelSection>

      <InfoBox>
        Select a preset to adjust all column widths at once. Changes will be
        reflected after clicking Accept.
      </InfoBox>

      <SidePanelSection>
        <SidePanelSectionHeader title='Filters' />
        <FiltersSectionFooter />
      </SidePanelSection>

      <SidePanelSection>
        <SidePanelSectionHeader title='Sorting' />
        <SortingSectionFooter />
      </SidePanelSection>

      <SidePanelSection>
        <SidePanelSectionHeader title='Columns' />
        <ColumnOrderSectionFooter />
      </SidePanelSection>

      <SidePanelSection>
        <SidePanelSectionHeader title='All Settings' />
        <div {...stylex.props(styles.buttonGroup)}>
          <Button
            color='outline'
            icon={<EraserIcon size={ICON_SIZE_MD} />}
            onClick={clearAllSettings}
            size='sm'
            width='full'
          >
            Clear All Settings
          </Button>
          <Button
            color='outline'
            icon={<RefreshIcon size={ICON_SIZE_MD} />}
            onClick={resetTableSettings}
            size='sm'
            width='full'
          >
            Reset All Settings
          </Button>
        </div>
      </SidePanelSection>
    </div>
  );
};
