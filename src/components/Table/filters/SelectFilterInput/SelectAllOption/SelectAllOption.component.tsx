import * as stylex from '@stylexjs/stylex';

import type { SelectAllOptionProps } from './SelectAllOption.types';

import { skeletonStyles, styles } from '../SelectFilterInput.stylex';

export const SelectAllOption = ({
  isAllSelected,
  isLoading,
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
    {isLoading && (
      <div {...stylex.props(skeletonStyles.loadingOverlay)}>
        <div {...stylex.props(skeletonStyles.shimmerWave)} />
      </div>
    )}
  </label>
);
