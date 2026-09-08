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

const SECTION_TITLE = 'Totals position';

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
