import * as stylex from '@stylexjs/stylex';

import type { SelectAllOptionProps } from './SelectAllOption.types';

import { styles } from '../SelectFilterInput.stylex';

export const SelectAllOption = ({
  isAllSelected,
  onSelectAll,
}: SelectAllOptionProps) => (
  <label {...stylex.props(styles.option)}>
    <input
      checked={isAllSelected}
      onChange={onSelectAll}
      type='checkbox'
      {...stylex.props(styles.checkbox)}
    />
    <span {...stylex.props(styles.label)}>
      {isAllSelected ? 'Deselect All' : 'Select All'}
    </span>
  </label>
);
