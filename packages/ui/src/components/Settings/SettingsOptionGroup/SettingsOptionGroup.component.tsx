import * as stylex from '@stylexjs/stylex';

import { RadioOptionGroup } from '#ui/components/RadioOptionGroup';

import type { SettingsOptionGroupProps } from './SettingsOptionGroup.types';

import { styles } from './SettingsOptionGroup.stylex';

export const SettingsOptionGroup = <TValue extends string>({
  name,
  onChange,
  options,
  title,
  value,
}: SettingsOptionGroupProps<TValue>) => (
  <fieldset {...stylex.props(styles.fieldset)}>
    <legend {...stylex.props(styles.legend)}>{title}</legend>
    <RadioOptionGroup
      name={name}
      onChange={onChange}
      options={options}
      value={value}
    />
  </fieldset>
);
