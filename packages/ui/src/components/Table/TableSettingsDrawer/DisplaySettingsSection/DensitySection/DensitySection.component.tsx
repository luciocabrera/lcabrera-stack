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

import type {
  DensityChoice,
  DensitySectionProps,
} from './DensitySection.types';

import { drawerFieldsetStyles } from '../../drawerFieldset.stylex';
import { DEFAULT_DENSITY_CHOICE } from './DensitySection.constants';

const LABELLED_OPTIONS = TABLE_DENSITY_LEVELS.map((value) => ({
  label: TABLE_DENSITY_LABELS[value],
  value,
}));

const DESCRIBED_OPTIONS = LABELLED_OPTIONS.map((option) => ({
  ...option,
  description: `${TABLE_DENSITY_SCALE[option.value].rowHeight}px rows`,
}));

export const DensitySection = ({
  defaultLabel,
  isBusy = false,
  name,
  onChange,
  title,
  value,
}: DensitySectionProps) => {
  const hasExplicitRowHeight = useGetTableHasExplicitRowHeight();
  const levelOptions = hasExplicitRowHeight
    ? LABELLED_OPTIONS
    : DESCRIBED_OPTIONS;

  const handleChange = (choice: DensityChoice) => {
    onChange(choice === DEFAULT_DENSITY_CHOICE ? undefined : choice);
  };

  return (
    <fieldset
      disabled={isBusy}
      {...stylex.props(
        drawerFieldsetStyles.container,
        drawerFieldsetStyles.fieldsetReset,
      )}
    >
      <legend {...stylex.props(accessibility.visuallyHidden)}>{title}</legend>
      <SidePanelSectionHeader title={title} />
      <RadioOptionGroup<DensityChoice>
        name={name}
        onChange={handleChange}
        options={[
          { label: defaultLabel, value: DEFAULT_DENSITY_CHOICE },
          ...levelOptions,
        ]}
        value={value ?? DEFAULT_DENSITY_CHOICE}
      />
    </fieldset>
  );
};
