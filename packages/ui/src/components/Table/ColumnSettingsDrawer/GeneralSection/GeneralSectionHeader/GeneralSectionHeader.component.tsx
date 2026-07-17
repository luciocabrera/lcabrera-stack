import {
  SidePanelSection,
  SidePanelSectionHeader,
} from '@repo/ui/components/SidePanel';
import { useGetNormalizedColumn } from '@repo/ui/components/Table/contexts/TableConfig/columns/selectors';
import {
  ColumnWidthPresetButtons,
  useColumnWidthPresetToggle,
} from '@repo/ui/components/Table/shared/ColumnWidthPresetButtons';
import * as stylex from '@stylexjs/stylex';

import type { GeneralSectionHeaderProps } from './GeneralSectionHeader.types';

import { useSetDraftColumnSizing } from '../../ColumnDrawerContext/actions';
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
  const setDraftColumnSizing = useSetDraftColumnSizing();

  const {
    handleToggleDefault,
    handleToggleMax,
    handleToggleMin,
    selectedPreset,
  } = useColumnWidthPresetToggle({
    onSelectPreset: (preset) =>
      setDraftColumnSizing(
        resolvePresetColumnWidth({
          maxWidth: column.maxWidth,
          minWidth: column.minWidth,
          preset,
        }),
      ),
  });

  const hasMinWidth = column.minWidth !== undefined;
  const hasMaxWidth = column.maxWidth !== undefined;

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
