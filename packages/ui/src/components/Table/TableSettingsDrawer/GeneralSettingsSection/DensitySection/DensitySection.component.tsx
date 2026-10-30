import * as stylex from '@stylexjs/stylex';

import { RadioOptionGroup } from '#ui/components/RadioOptionGroup';
import { SidePanelSectionHeader } from '#ui/components/SidePanel';
import {
  TABLE_DENSITY_LABELS,
  TABLE_DENSITY_LEVELS,
  TABLE_DENSITY_ROW_HEIGHT,
} from '#ui/components/Table/Table.constants';
import { accessibility } from '#ui/design-system/tokens/commons.stylex';

import type { DensitySectionProps } from './DensitySection.types';

import { drawerFieldsetStyles } from '../../drawerFieldset.stylex';
import { useSetDensity } from '../../TableDrawerContext/actions';
import { useGetDensity } from '../../TableDrawerContext/selectors';

const SECTION_TITLE = 'Density';

const options = TABLE_DENSITY_LEVELS.map((value) => ({
  description: `${TABLE_DENSITY_ROW_HEIGHT[value]}px rows`,
  label: TABLE_DENSITY_LABELS[value],
  value,
}));

export const DensitySection = ({ isBusy = false }: DensitySectionProps) => {
  const density = useGetDensity();
  const setDensity = useSetDensity();

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
        options={options}
        value={density}
      />
    </fieldset>
  );
};
