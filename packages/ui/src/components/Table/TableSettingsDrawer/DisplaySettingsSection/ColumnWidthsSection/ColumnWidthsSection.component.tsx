import * as stylex from '@stylexjs/stylex';

import {
  SidePanelSection,
  SidePanelSectionHeader,
} from '#ui/components/SidePanel';
import { useGetColumns } from '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import {
  ColumnWidthPresetButtons,
  useColumnWidthPresetToggle,
} from '#ui/components/Table/shared/ColumnWidthPresetButtons';

import type { ColumnWidthsSectionProps } from './ColumnWidthsSection.types';

import { useSetColumnsSizing } from '../../TableDrawerContext/actions';
import { buildPresetColumnSizing } from '../utils/buildPresetColumnSizing.util';
import { styles } from './ColumnWidthsSection.stylex';

export const ColumnWidthsSection = ({
  isBusy = false,
}: ColumnWidthsSectionProps) => {
  const columns = useGetColumns();
  const setColumnsSizing = useSetColumnsSizing();

  const {
    handleToggleDefault,
    handleToggleMax,
    handleToggleMin,
    selectedPreset,
  } = useColumnWidthPresetToggle({
    onSelectPreset: (preset) =>
      setColumnsSizing(buildPresetColumnSizing({ columns, preset })),
  });

  const hasMinWidthsConfigured = columns.some((col) => col.minWidth);
  const hasMaxWidthsConfigured = columns.some((col) => col.maxWidth);

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
