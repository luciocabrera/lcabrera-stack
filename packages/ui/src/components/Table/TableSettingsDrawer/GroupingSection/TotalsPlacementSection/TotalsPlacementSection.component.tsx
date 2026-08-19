import * as stylex from '@stylexjs/stylex';

import { RadioOptionGroup } from '#ui/components/RadioOptionGroup';
import { SidePanelSectionHeader } from '#ui/components/SidePanel';
import {
  TABLE_TOTALS_PLACEMENT_LABELS,
  TABLE_TOTALS_PLACEMENTS,
} from '#ui/components/Table/Table.constants';
import { accessibility } from '#ui/design-system/tokens/commons.stylex';

import type { TotalsPlacementSectionProps } from './TotalsPlacementSection.types';

import { useSetTotalsPlacement } from '../../TableDrawerContext/actions';
import {
  useGetGroupingMode,
  useGetTotalsPlacement,
} from '../../TableDrawerContext/selectors';
import { styles } from './TotalsPlacementSection.stylex';

/** Named once, so the visible heading and the accessible group name agree. */
const SECTION_TITLE = 'Totals position';

/**
 * Where a subtotal sits relative to the rows it totals.
 *
 * **Rendered only in `rollup`**, because that is the only mode that emits a
 * total at all — offered under `flat` it would be a control with nothing to
 * place, and the staged mode is the honest thing to read since Accept commits
 * both together.
 *
 * It stages like every other delegate here, but what it stages is not part of
 * the grouping configuration: placement rides the `totals` param and the
 * UI-flags cookie rather than the `grouping` param, because it outlives the
 * table it was set on (#578).
 */
export const TotalsPlacementSection = ({
  isBusy = false,
}: TotalsPlacementSectionProps) => {
  const mode = useGetGroupingMode();
  const totalsPlacement = useGetTotalsPlacement();
  const setTotalsPlacement = useSetTotalsPlacement();

  if (mode !== 'rollup') return;

  const options = TABLE_TOTALS_PLACEMENTS.map((value) => ({
    label: TABLE_TOTALS_PLACEMENT_LABELS[value],
    value,
  }));

  return (
    <fieldset
      disabled={isBusy}
      {...stylex.props(styles.container, styles.fieldsetReset)}
      data-testid='totals-placement-section'
    >
      {/*
       * A `<fieldset>` takes its accessible name from its `<legend>` and from
       * nothing else — `SidePanelSectionHeader` renders a heading beside the
       * group, not a name for it. Visually hidden because the heading already
       * shows the words; both read `SECTION_TITLE` so they cannot drift.
       */}
      <legend {...stylex.props(accessibility.visuallyHidden)}>
        {SECTION_TITLE}
      </legend>
      <SidePanelSectionHeader title={SECTION_TITLE} />
      <RadioOptionGroup
        name='table-totals-placement'
        onChange={setTotalsPlacement}
        options={options}
        value={totalsPlacement}
      />
    </fieldset>
  );
};
