import * as stylex from '@stylexjs/stylex';

import type { SelectAllOptionProps } from './SelectAllOption.types';

import { skeletonStyles, styles } from '../SelectFilterInput.stylex';

export const SelectAllOption = ({
  isAllSelected,
  isLoading,
  onSelectAll,
}: SelectAllOptionProps) => (
  <label {...stylex.props(styles.option, isLoading && styles.optionDisabled)}>
    <input
      checked={isAllSelected}
      disabled={isLoading}
      onChange={onSelectAll}
      type='checkbox'
      {...stylex.props(styles.checkbox)}
    />
    {!isLoading && (
      <span {...stylex.props(styles.label)}>
        {isAllSelected ? 'Deselect All' : 'Select All'}
      </span>
    )}
    {isLoading && (
      <div {...stylex.props(skeletonStyles.loadingOverlay)}>
        <div {...stylex.props(skeletonStyles.shimmerWave)} />
      </div>
    )}
  </label>
);
