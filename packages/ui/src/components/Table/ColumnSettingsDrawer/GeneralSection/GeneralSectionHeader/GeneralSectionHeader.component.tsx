import * as stylex from '@stylexjs/stylex';

import {
  SidePanelSection,
  SidePanelSectionHeader,
} from '#ui/components/SidePanel';
import { useGetNormalizedColumn } from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import {
  ColumnWidthPresetButtons,
  useColumnWidthPresetToggle,
} from '#ui/components/Table/shared/ColumnWidthPresetButtons';

import type { GeneralSectionHeaderProps } from './GeneralSectionHeader.types';

import { useSetDraftColumnSizing } from '../../ColumnDrawerContext/actions';
import { resolvePresetColumnWidth } from '../utils/resolvePresetColumnWidth.util';
import { styles } from './GeneralSectionHeader.stylex';

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
