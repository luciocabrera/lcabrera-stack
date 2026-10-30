import * as stylex from '@stylexjs/stylex';

import { RadioOptionGroup } from '#ui/components/RadioOptionGroup';
import { SidePanelSectionHeader } from '#ui/components/SidePanel';
import { useGetTableHasExplicitRowHeight } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import {
  TABLE_DENSITY_LABELS,
  TABLE_DENSITY_LEVELS,
  TABLE_DENSITY_SCALE,
} from '#ui/components/Table/Table.constants';
import { accessibility } from '#ui/design-system/tokens/commons.stylex';

import type { DensitySectionProps } from './DensitySection.types';

import { drawerFieldsetStyles } from '../../drawerFieldset.stylex';
import { useSetDensity } from '../../TableDrawerContext/actions';
import { useGetDensity } from '../../TableDrawerContext/selectors';

const SECTION_TITLE = 'Density';

const LABELLED_OPTIONS = TABLE_DENSITY_LEVELS.map((value) => ({
  label: TABLE_DENSITY_LABELS[value],
  value,
}));

const DESCRIBED_OPTIONS = LABELLED_OPTIONS.map((option) => ({
  ...option,
  description: `${TABLE_DENSITY_SCALE[option.value].rowHeight}px rows`,
}));

export const DensitySection = ({ isBusy = false }: DensitySectionProps) => {
  const density = useGetDensity();
  const setDensity = useSetDensity();
  const hasExplicitRowHeight = useGetTableHasExplicitRowHeight();

  return (
    <fieldset
      disabled={isBusy}
      {...stylex.props(
        drawerFieldsetStyles.container,
        drawerFieldsetStyles.fieldsetReset,
      )}
    >
      <legend {...stylex.props(accessibility.visuallyHidden)}>
        {SECTION_TITLE}
      </legend>
      <SidePanelSectionHeader title={SECTION_TITLE} />
      <RadioOptionGroup
        name='table-density'
        onChange={setDensity}
        options={hasExplicitRowHeight ? LABELLED_OPTIONS : DESCRIBED_OPTIONS}
        value={density}
      />
    </fieldset>
  );
};
