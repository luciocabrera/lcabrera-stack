import * as stylex from '@stylexjs/stylex';

import { RadioOptionGroup } from '#ui/components/RadioOptionGroup';
import { SidePanelSectionHeader } from '#ui/components/SidePanel';
import { useGetTableIsGroupingLocked } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import {
  TABLE_GROUPING_MODE_LABELS,
  TABLE_GROUPING_MODES,
} from '#ui/components/Table/Table.constants';
import { accessibility } from '#ui/design-system/tokens/commons.stylex';

import type { GroupingModeSectionProps } from './GroupingModeSection.types';

import { useSetGroupingMode } from '../../TableDrawerContext/actions';
import { useGetGroupingMode } from '../../TableDrawerContext/selectors';
import { styles } from './GroupingModeSection.stylex';

const SECTION_TITLE = 'Totals';

export const GroupingModeSection = ({
  isBusy = false,
}: GroupingModeSectionProps) => {
  const mode = useGetGroupingMode();
  const isGroupingLocked = useGetTableIsGroupingLocked();
  const setGroupingMode = useSetGroupingMode();

  if (isGroupingLocked) return;

  const options = TABLE_GROUPING_MODES.map((value) => ({
    label: TABLE_GROUPING_MODE_LABELS[value],
    value,
  }));

  return (
    <fieldset
      disabled={isBusy}
      {...stylex.props(styles.container, styles.fieldsetReset)}
      data-testid='grouping-mode-section'
    >
      <legend {...stylex.props(accessibility.visuallyHidden)}>
        {SECTION_TITLE}
      </legend>
      <SidePanelSectionHeader title={SECTION_TITLE} />
      <RadioOptionGroup
        name='table-grouping-mode'
        onChange={setGroupingMode}
        options={options}
        value={mode}
      />
    </fieldset>
  );
};
