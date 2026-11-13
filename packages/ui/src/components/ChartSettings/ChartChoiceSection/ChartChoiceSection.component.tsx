import * as stylex from '@stylexjs/stylex';

import { RadioOptionGroup } from '#ui/components/RadioOptionGroup';
import { drawerFieldsetStyles } from '#ui/components/Table/TableSettingsDrawer/drawerFieldset.stylex';

import type { ChartChoiceSectionProps } from './ChartChoiceSection.types';

import { chartSectionStyles } from './ChartChoiceSection.stylex';

export const ChartChoiceSection = ({
  name,
  onChange,
  options,
  title,
  value,
}: ChartChoiceSectionProps) => (
  <fieldset
    {...stylex.props(
      drawerFieldsetStyles.container,
      drawerFieldsetStyles.fieldsetReset,
    )}
  >
    <legend {...stylex.props(chartSectionStyles.legend)}>{title}</legend>
    <RadioOptionGroup
      name={name}
      onChange={onChange}
      options={options}
      value={value}
    />
  </fieldset>
);
