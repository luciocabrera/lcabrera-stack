import * as stylex from '@stylexjs/stylex';

import { RadioOptionGroup } from '#ui/components/RadioOptionGroup';
import { useGetTableHasExplicitRowHeight } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import {
  TABLE_DENSITY_LABELS,
  TABLE_DENSITY_LEVELS,
  TABLE_DENSITY_SCALE,
} from '#ui/components/Table/Table.constants';

import type {
  DensityChoice,
  DensitySectionProps,
} from './DensitySection.types';

import { drawerFieldsetStyles } from '../../drawerFieldset.stylex';
import { DEFAULT_DENSITY_CHOICE } from './DensitySection.constants';
import { styles } from './DensitySection.stylex';

const LABELLED_OPTIONS = TABLE_DENSITY_LEVELS.map((value) => ({
  label: TABLE_DENSITY_LABELS[value],
  value,
}));

const toDescribedOptions = (heightSuffix: string) =>
  LABELLED_OPTIONS.map((option) => ({
    ...option,
    description: `${TABLE_DENSITY_SCALE[option.value].rowHeight}px ${heightSuffix}`,
  }));

export const DensitySection = ({
  defaultLabel,
  heightSuffix,
  isBusy = false,
  name,
  onChange,
  title,
  value,
}: DensitySectionProps) => {
  const hasExplicitRowHeight = useGetTableHasExplicitRowHeight();
  const levelOptions =
    heightSuffix === undefined || hasExplicitRowHeight
      ? LABELLED_OPTIONS
      : toDescribedOptions(heightSuffix);

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
      <legend {...stylex.props(styles.legend)}>{title}</legend>
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
