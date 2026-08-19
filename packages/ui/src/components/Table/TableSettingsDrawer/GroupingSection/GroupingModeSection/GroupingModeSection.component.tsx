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

/** Named once, so the visible heading and the accessible group name agree. */
const SECTION_TITLE = 'Totals';

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
  const isGroupingLocked = useGetTableIsGroupingLocked();
  const setGroupingMode = useSetGroupingMode();

  // Which grouping sets the read emits is part of the curated shape, so a lock
  // covers it (#578).
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
      {/*
       * A `<fieldset>` takes its accessible name from its `<legend>` and from
       * nothing else — `SidePanelSectionHeader` renders a heading beside the
       * group, not a name for it, so without this the radios are an unnamed
       * group. It is visually hidden because the heading already shows the
       * word; both read from `SECTION_TITLE` so they cannot drift apart.
       */}
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
