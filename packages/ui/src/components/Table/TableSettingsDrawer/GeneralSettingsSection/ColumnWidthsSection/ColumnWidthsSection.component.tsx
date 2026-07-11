import type { WidthPreset } from '@repo/ui/components/Table/shared/ColumnWidthPresetButtons';

import {
  SidePanelSection,
  SidePanelSectionHeader,
} from '@repo/ui/components/SidePanel';
import { useGetColumns } from '@repo/ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import { ColumnWidthPresetButtons } from '@repo/ui/components/Table/shared/ColumnWidthPresetButtons';
import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import type { ColumnWidthsSectionProps } from './ColumnWidthsSection.types';

import { useSetColumnsSizing } from '../../TableDrawerContext/actions';
import { buildPresetColumnSizing } from '../utils/buildPresetColumnSizing.util';
import { styles } from './ColumnWidthsSection.stylex';

/**
 * "Column Widths" section of the general settings tab: min/max/default width
 * preset toggles. Selecting a preset bulk-writes the drawer's column sizing;
 * deselecting reverts to the current state (no write). Presets without any
 * configured bound are disabled.
 */
export const ColumnWidthsSection = ({
  isBusy = false,
}: ColumnWidthsSectionProps) => {
  const columns = useGetColumns();
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

    setColumnsSizing(buildPresetColumnSizing({ columns, preset: newPreset }));
  };

  const handleToggleDefault = () => handleToggle('default');
  const handleToggleMax = () => handleToggle('max');
  const handleToggleMin = () => handleToggle('min');

  return (
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
  );
};
