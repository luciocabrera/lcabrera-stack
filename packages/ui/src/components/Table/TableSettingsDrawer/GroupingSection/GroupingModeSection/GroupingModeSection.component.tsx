import * as stylex from '@stylexjs/stylex';

import { RadioOptionGroup } from '#ui/components/RadioOptionGroup';
import { SidePanelSectionHeader } from '#ui/components/SidePanel';
import {
  TABLE_GROUPING_MODE_LABELS,
  TABLE_GROUPING_MODES,
} from '#ui/components/Table/Table.constants';

import type { GroupingModeSectionProps } from './GroupingModeSection.types';

import { useSetGroupingMode } from '../../TableDrawerContext/actions';
import { useGetGroupingMode } from '../../TableDrawerContext/selectors';
import { styles } from './GroupingModeSection.stylex';

/**
 * The drawer's grouping-mode control: whether the read returns one row per
 * group, or those rows plus a subtotal for every level and a grand total.
 *
 * Self-connected like every other delegate in this section — it reads the
 * staged mode and dispatches its own action, so `GroupingSection` forwards
 * nothing but `isBusy`.
 *
 * The option labels state what changes in the grid rather than which SQL is
 * emitted: the mode is chosen for what it makes readable, and `GROUP BY ROLLUP`
 * is not a phrase the picker should require.
 */
export const GroupingModeSection = ({
  isBusy = false,
}: GroupingModeSectionProps) => {
  const mode = useGetGroupingMode();
  const setGroupingMode = useSetGroupingMode();

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
      <SidePanelSectionHeader title='Totals' />
      <RadioOptionGroup
        name='table-grouping-mode'
        onChange={setGroupingMode}
        options={options}
        value={mode}
      />
    </fieldset>
  );
};
