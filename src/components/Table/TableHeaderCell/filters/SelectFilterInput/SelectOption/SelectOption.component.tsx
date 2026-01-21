import * as stylex from '@stylexjs/stylex';

import type { SelectOptionProps } from './SelectOption.types';

import { styles } from '../SelectFilterInput.stylex';

export const SelectOption = ({
  isSelected,
  onToggle,
  option,
}: SelectOptionProps) => (
  <label {...stylex.props(styles.option)}>
    <input
      checked={isSelected}
      onChange={onToggle}
      type='checkbox'
      {...stylex.props(styles.checkbox)}
    />
    <span {...stylex.props(styles.label)}>{option}</span>
  </label>
);
