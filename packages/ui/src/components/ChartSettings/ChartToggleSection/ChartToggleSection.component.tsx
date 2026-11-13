import * as stylex from '@stylexjs/stylex';

import { drawerFieldsetStyles } from '#ui/components/Table/TableSettingsDrawer/drawerFieldset.stylex';
import { ToggleSwitch } from '#ui/components/ToggleSwitch';

import type { ChartToggleSectionProps } from './ChartToggleSection.types';

import { chartSectionStyles } from '../ChartChoiceSection/ChartChoiceSection.stylex';

export const ChartToggleSection = ({
  title,
  toggles,
}: ChartToggleSectionProps) => {
  if (toggles.length === 0) return;

  return (
    <fieldset
      {...stylex.props(
        drawerFieldsetStyles.container,
        drawerFieldsetStyles.fieldsetReset,
        chartSectionStyles.toggles,
      )}
    >
      <legend {...stylex.props(chartSectionStyles.legend)}>{title}</legend>
      {toggles.map(({ isChecked, key, label, onChange }) => (
        <ToggleSwitch
          isChecked={isChecked}
          key={key}
          label={label}
          onChange={onChange}
        />
      ))}
    </fieldset>
  );
};
