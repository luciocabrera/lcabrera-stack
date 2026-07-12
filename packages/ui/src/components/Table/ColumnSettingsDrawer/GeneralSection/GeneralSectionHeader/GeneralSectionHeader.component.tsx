import type { WidthPreset } from '@repo/ui/components/Table/shared/ColumnWidthPresetButtons';

import {
  SidePanelSection,
  SidePanelSectionHeader,
} from '@repo/ui/components/SidePanel';
import { useGetNormalizedColumn } from '@repo/ui/components/Table/contexts/TableConfig/columns/selectors';
import { ColumnWidthPresetButtons } from '@repo/ui/components/Table/shared/ColumnWidthPresetButtons';
import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import type { GeneralSectionHeaderProps } from './GeneralSectionHeader.types';

import { useSetColumnSizing } from '../../ColumnDrawerContext/actions';
import { resolvePresetColumnWidth } from '../utils/resolvePresetColumnWidth.util';
import { styles } from './GeneralSectionHeader.stylex';

/**
 * Header of the general section: the per-column min/max/default width preset
 * toggles. Reads the normalized column itself to derive the preset bounds
 * and writes the drawer's column sizing on selection; deselecting reverts to
 * the current state (no write). Presets without a configured bound are
 * disabled.
 */
export const GeneralSectionHeader = <TData,>({
  columnKey,
  isBusy = false,
}: GeneralSectionHeaderProps<TData>) => {
  const column = useGetNormalizedColumn<TData>(columnKey);
  const setColumnSizing = useSetColumnSizing();

  const [selectedPreset, setSelectedPreset] = useState<WidthPreset>();

  const hasMinWidth = column.minWidth !== undefined;
  const hasMaxWidth = column.maxWidth !== undefined;

  const handleToggle = (preset: 'default' | 'max' | 'min') => {
    const newPreset = selectedPreset === preset ? undefined : preset;
    setSelectedPreset(newPreset);

    if (newPreset === undefined) {
      // Deselected — revert to current state (do nothing)
      return;
    }

    setColumnSizing(
      resolvePresetColumnWidth({
        maxWidth: column.maxWidth,
        minWidth: column.minWidth,
        preset: newPreset,
      }),
    );
  };

  const handleToggleDefault = () => handleToggle('default');
  const handleToggleMax = () => handleToggle('max');
  const handleToggleMin = () => handleToggle('min');

  return (
    <SidePanelSection>
      <SidePanelSectionHeader title='Column Width' />
      <div {...stylex.props(styles.buttonGroup)}>
        <ColumnWidthPresetButtons
          isBusy={isBusy}
          isMaxDisabled={!hasMaxWidth}
          isMinDisabled={!hasMinWidth}
          onToggleDefault={handleToggleDefault}
          onToggleMax={handleToggleMax}
          onToggleMin={handleToggleMin}
          selectedPreset={selectedPreset}
        />
      </div>
    </SidePanelSection>
  );
};
